use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;
use std::path::PathBuf;

const CURRENT_VERSION: u32 = 3;

/// Represents a single installed skill entry in the lock file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLockEntry {
	/// Normalized source identifier (e.g., "owner/repo", "mintlify/bun.com")
	pub source: String,
	/// The provider/source type (e.g., "github", "mintlify", "huggingface", "local")
	#[serde(rename = "sourceType")]
	pub source_type: String,
	/// The original URL used to install the skill (for re-fetching updates)
	#[serde(rename = "sourceUrl")]
	pub source_url: String,
	/// Subpath within the source repo, if applicable
	#[serde(rename = "skillPath", skip_serializing_if = "Option::is_none")]
	pub skill_path: Option<String>,
	/// GitHub tree SHA for the entire skill folder.
	/// This hash changes when ANY file in the skill folder changes.
	/// Fetched via GitHub Trees API by the telemetry server.
	#[serde(rename = "skillFolderHash")]
	pub skill_folder_hash: String,
	/// ISO timestamp when the skill was first installed
	#[serde(rename = "installedAt")]
	pub installed_at: String,
	/// ISO timestamp when the skill was last updated
	#[serde(rename = "updatedAt")]
	pub updated_at: String,
	/// Name of the plugin this skill belongs to (if any)
	#[serde(rename = "pluginName", skip_serializing_if = "Option::is_none")]
	pub plugin_name: Option<String>,
}

/// Tracks dismissed prompts so they're not shown again.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DismissedPrompts {
	/// Dismissed the find-skills skill installation prompt
	#[serde(rename = "findSkillsPrompt", skip_serializing_if = "Option::is_none")]
	pub find_skills_prompt: Option<bool>,
}

/// The structure of the skill lock file.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillLockFile {
	/// Schema version for future migrations
	pub version: u32,
	/// Map of skill name to its lock entry
	pub skills: BTreeMap<String, SkillLockEntry>,
	/// Tracks dismissed prompts
	#[serde(skip_serializing_if = "Option::is_none")]
	pub dismissed: Option<DismissedPrompts>,
	/// Last selected agents for installation
	#[serde(rename = "lastSelectedAgents", skip_serializing_if = "Option::is_none")]
	pub last_selected_agents: Option<Vec<String>>,
}

impl Default for SkillLockFile {
	fn default() -> Self {
		Self {
			version: CURRENT_VERSION,
			skills: BTreeMap::new(),
			dismissed: None,
			last_selected_agents: None,
		}
	}
}

impl SkillLockFile {
	/// Create a new empty lock file.
	pub fn new() -> Self {
		Self::default()
	}
}

/// Get the path to the global skill lock file.
/// Use $XDG_STATE_HOME/skills/.skill-lock.json if set.
/// otherwise fall back to ~/.agents/.skill-lock.json
pub fn get_skill_lock_path() -> PathBuf {
	if let Ok(xdg_state_home) = std::env::var("XDG_STATE_HOME") {
		PathBuf::from(xdg_state_home)
			.join("skills")
			.join(".skill-lock.json")
	} else {
		dirs::home_dir()
			.unwrap_or_else(|| PathBuf::from("."))
			.join(".agents")
			.join(".skill-lock.json")
	}
}

/// Read the skill lock file.
/// Returns an empty lock file structure if the file doesn't exist.
/// Wipes the lock file if it's an old format (version < CURRENT_VERSION).
pub fn read_skill_lock() -> SkillLockFile {
	let lock_path = get_skill_lock_path();

	match std::fs::read_to_string(&lock_path) {
		Ok(content) => {
			match serde_json::from_str::<SkillLockFile>(&content) {
				Ok(lock) => {
					// If old version, wipe and start fresh (backwards incompatible change)
					// v3 adds skillFolderHash - we want fresh installs to populate it
					if lock.version < CURRENT_VERSION {
						SkillLockFile::new()
					} else {
						lock
					}
				}
				Err(_) => {
					// File doesn't exist or is invalid - return empty
					SkillLockFile::new()
				}
			}
		}
		Err(_) => SkillLockFile::new(),
	}
}

/// Write the skill lock file.
/// Creates the directory if it doesn't exist.
pub fn write_skill_lock(lock: &SkillLockFile) -> std::io::Result<()> {
	let lock_path = get_skill_lock_path();

	// Ensure directory exists
	if let Some(parent) = lock_path.parent() {
		std::fs::create_dir_all(parent)?;
	}

	let content = serde_json::to_string_pretty(lock)? + "\n";
	std::fs::write(lock_path, content)
}

/// Add or update a skill entry in the lock file.
pub fn add_skill_to_lock(
	skill_name: &str,
	mut entry: SkillLockEntry,
) -> std::io::Result<()> {
	let mut lock = read_skill_lock();
	let now = Utc::now().to_rfc3339();

	if let Some(existing) = lock.skills.get(skill_name) {
		// Preserve the original installedAt timestamp
		entry.installed_at = existing.installed_at.clone();
	} else {
		entry.installed_at = now.clone();
	}
	entry.updated_at = now;

	lock.skills.insert(skill_name.to_string(), entry);
	write_skill_lock(&lock)
}

/// Remove a skill from the lock file.
pub fn remove_skill_from_lock(skill_name: &str) -> std::io::Result<bool> {
	let mut lock = read_skill_lock();

	if lock.skills.remove(skill_name).is_some() {
		write_skill_lock(&lock)?;
		Ok(true)
	} else {
		Ok(false)
	}
}

/// Get a skill entry from the lock file.
pub fn get_skill_from_lock(skill_name: &str) -> Option<SkillLockEntry> {
	let lock = read_skill_lock();
	lock.skills.get(skill_name).cloned()
}

/// Get all skills from the lock file.
pub fn get_all_locked_skills() -> BTreeMap<String, SkillLockEntry> {
	let lock = read_skill_lock();
	lock.skills
}

/// Get skills grouped by source for batch update operations.
pub fn get_skills_by_source() -> BTreeMap<String, Vec<String>> {
	let lock = read_skill_lock();
	let mut by_source = BTreeMap::new();

	for (skill_name, entry) in lock.skills.iter() {
		by_source
			.entry(entry.source.clone())
			.or_insert_with(Vec::new)
			.push(skill_name.clone());
	}

	by_source
}

/// Check if a prompt has been dismissed.
pub fn is_prompt_dismissed(prompt_key: &str) -> bool {
	let lock = read_skill_lock();
	lock.dismissed
		.as_ref()
		.and_then(|d| match prompt_key {
			"findSkillsPrompt" => d.find_skills_prompt,
			_ => None,
		})
		.unwrap_or(false)
}

/// Mark a prompt as dismissed.
pub fn dismiss_prompt(prompt_key: &str) -> std::io::Result<()> {
	let mut lock = read_skill_lock();
	if lock.dismissed.is_none() {
		lock.dismissed = Some(DismissedPrompts::default());
	}

	if let Some(ref mut dismissed) = lock.dismissed {
		match prompt_key {
			"findSkillsPrompt" => dismissed.find_skills_prompt = Some(true),
			_ => {}
		}
	}

	write_skill_lock(&lock)
}

/// Get the last selected agents.
pub fn get_last_selected_agents() -> Option<Vec<String>> {
	let lock = read_skill_lock();
	lock.last_selected_agents
}

/// Save the selected agents to the lock file.
pub fn save_selected_agents(agents: Vec<String>) -> std::io::Result<()> {
	let mut lock = read_skill_lock();
	lock.last_selected_agents = Some(agents);
	write_skill_lock(&lock)
}

/// Compute SHA-256 hash of content.
pub fn compute_content_hash(content: &str) -> String {
	format!("{:x}", Sha256::digest(content.as_bytes()))
}

#[cfg(test)]
mod tests {
	use super::*;
	use std::fs;
	use std::path::Path;
	use std::sync::Mutex;
	use tempfile::TempDir;

	// Use a mutex to prevent parallel test execution
	static TEST_MUTEX: Mutex<()> = Mutex::new(());

	#[test]
	fn test_get_skill_lock_path_with_xdg() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let path = get_skill_lock_path();
		assert!(path.starts_with(temp_dir.path()));
		assert!(path.ends_with(".skill-lock.json"));

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_get_skill_lock_path_without_xdg() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::remove_var("XDG_STATE_HOME");

		let path = get_skill_lock_path();
		assert!(path.ends_with(".skill-lock.json"));
		assert!(path.to_string_lossy().contains(".agents"));

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		}
	}

	#[test]
	fn test_read_skill_lock_missing_file() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let lock = read_skill_lock();
		assert_eq!(lock.version, 3);
		assert!(lock.skills.is_empty());

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_read_skill_lock_old_version_wipes() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let old_lock = r#"{
  "version": 2,
  "skills": {
    "old-skill": {
      "source": "org/repo",
      "sourceType": "github",
      "sourceUrl": "https://github.com/org/repo",
      "skillFolderHash": "old",
      "installedAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  }
}"#;

		let lock_path = get_skill_lock_path();
		fs::create_dir_all(lock_path.parent().unwrap()).unwrap();
		fs::write(&lock_path, old_lock).unwrap();

		let lock = read_skill_lock();
		assert_eq!(lock.version, 3);
		assert!(lock.skills.is_empty()); // Old version should be wiped

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_write_skill_lock_creates_directory() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let mut lock = SkillLockFile::new();
		lock.skills.insert(
			"test-skill".to_string(),
			SkillLockEntry {
				source: "owner/repo".to_string(),
				source_type: "github".to_string(),
				source_url: "https://github.com/owner/repo".to_string(),
				skill_path: None,
				skill_folder_hash: "abc123".to_string(),
				installed_at: "2024-01-01T00:00:00Z".to_string(),
				updated_at: "2024-01-01T00:00:00Z".to_string(),
				plugin_name: None,
			},
		);

		write_skill_lock(&lock).unwrap();

		let lock_path = get_skill_lock_path();
		assert!(lock_path.exists());

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_add_skill_to_lock_new() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let entry = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: Some("skills/my-skill".to_string()),
			skill_folder_hash: "def456".to_string(),
			installed_at: String::new(),
			updated_at: String::new(),
			plugin_name: None,
		};

		add_skill_to_lock("new-skill", entry).unwrap();

		let lock = read_skill_lock();
		assert!(lock.skills.contains_key("new-skill"));
		let stored = lock.skills.get("new-skill").unwrap();
		assert!(!stored.installed_at.is_empty());
		assert!(!stored.updated_at.is_empty());

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_add_skill_to_lock_preserves_installed_at() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		// Add initial skill
		let entry1 = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash1".to_string(),
			installed_at: String::new(),
			updated_at: String::new(),
			plugin_name: None,
		};
		add_skill_to_lock("my-skill", entry1).unwrap();

		let lock1 = read_skill_lock();
		let original_installed_at = lock1
			.skills
			.get("my-skill")
			.unwrap()
			.installed_at
			.clone();

		// Update the same skill
		let entry2 = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash2".to_string(),
			installed_at: String::new(),
			updated_at: String::new(),
			plugin_name: None,
		};
		add_skill_to_lock("my-skill", entry2).unwrap();

		let lock2 = read_skill_lock();
		let updated = lock2.skills.get("my-skill").unwrap();

		// installedAt should be preserved, updatedAt should change
		assert_eq!(updated.installed_at, original_installed_at);
		assert_ne!(updated.updated_at, original_installed_at);
		assert_eq!(updated.skill_folder_hash, "hash2");

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_remove_skill_from_lock() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let entry = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash".to_string(),
			installed_at: "2024-01-01T00:00:00Z".to_string(),
			updated_at: "2024-01-01T00:00:00Z".to_string(),
			plugin_name: None,
		};
		add_skill_to_lock("my-skill", entry).unwrap();

		let removed = remove_skill_from_lock("my-skill").unwrap();
		assert!(removed);

		let lock = read_skill_lock();
		assert!(!lock.skills.contains_key("my-skill"));

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_get_skill_from_lock() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let entry = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash".to_string(),
			installed_at: "2024-01-01T00:00:00Z".to_string(),
			updated_at: "2024-01-01T00:00:00Z".to_string(),
			plugin_name: None,
		};
		add_skill_to_lock("my-skill", entry.clone()).unwrap();

		let retrieved = get_skill_from_lock("my-skill");
		assert!(retrieved.is_some());
		assert_eq!(retrieved.unwrap().source, "owner/repo");

		let not_found = get_skill_from_lock("nonexistent");
		assert!(not_found.is_none());

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_get_all_locked_skills() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let entry = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash".to_string(),
			installed_at: "2024-01-01T00:00:00Z".to_string(),
			updated_at: "2024-01-01T00:00:00Z".to_string(),
			plugin_name: None,
		};

		add_skill_to_lock("skill-a", entry.clone()).unwrap();
		add_skill_to_lock("skill-b", entry).unwrap();

		let all = get_all_locked_skills();
		assert_eq!(all.len(), 2);

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_get_skills_by_source() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		let entry1 = SkillLockEntry {
			source: "owner/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/owner/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash".to_string(),
			installed_at: "2024-01-01T00:00:00Z".to_string(),
			updated_at: "2024-01-01T00:00:00Z".to_string(),
			plugin_name: None,
		};

		let entry2 = SkillLockEntry {
			source: "other/repo".to_string(),
			source_type: "github".to_string(),
			source_url: "https://github.com/other/repo".to_string(),
			skill_path: None,
			skill_folder_hash: "hash2".to_string(),
			installed_at: "2024-01-01T00:00:00Z".to_string(),
			updated_at: "2024-01-01T00:00:00Z".to_string(),
			plugin_name: None,
		};

		add_skill_to_lock("skill-a", entry1.clone()).unwrap();
		add_skill_to_lock("skill-b", entry1).unwrap();
		add_skill_to_lock("skill-c", entry2).unwrap();

		let by_source = get_skills_by_source();
		assert_eq!(by_source.len(), 2);
		assert_eq!(by_source.get("owner/repo").unwrap().len(), 2);
		assert_eq!(by_source.get("other/repo").unwrap().len(), 1);

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_dismiss_prompt() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		assert!(!is_prompt_dismissed("findSkillsPrompt"));

		dismiss_prompt("findSkillsPrompt").unwrap();
		assert!(is_prompt_dismissed("findSkillsPrompt"));

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_save_and_get_last_selected_agents() {
		let _lock = TEST_MUTEX.lock().unwrap();
		let temp_dir = TempDir::new().unwrap();
		let old_xdg = std::env::var("XDG_STATE_HOME").ok();
		std::env::set_var("XDG_STATE_HOME", temp_dir.path());

		assert!(get_last_selected_agents().is_none());

		save_selected_agents(vec!["claude".to_string(), "cursor".to_string()])
			.unwrap();

		let agents = get_last_selected_agents();
		assert!(agents.is_some());
		let agents = agents.unwrap();
		assert_eq!(agents.len(), 2);
		assert!(agents.contains(&"claude".to_string()));
		assert!(agents.contains(&"cursor".to_string()));

		if let Some(old) = old_xdg {
			std::env::set_var("XDG_STATE_HOME", old);
		} else {
			std::env::remove_var("XDG_STATE_HOME");
		}
	}

	#[test]
	fn test_compute_content_hash() {
		let hash1 = compute_content_hash("test content");
		let hash2 = compute_content_hash("test content");
		assert_eq!(hash1, hash2);
		assert_eq!(hash1.len(), 64); // SHA-256 produces 64 hex characters

		let hash3 = compute_content_hash("different content");
		assert_ne!(hash1, hash3);
	}
}