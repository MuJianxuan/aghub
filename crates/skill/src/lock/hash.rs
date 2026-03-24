use sha2::{Digest, Sha256};
use std::path::Path;
use walkdir::WalkDir;

use crate::error::Result;

/// Compute a SHA-256 hash from all files in a skill directory.
/// Reads all files recursively, sorts them by relative path for determinism,
/// and produces a single hash from their concatenated contents.
pub fn compute_skill_folder_hash(skill_dir: &Path) -> Result<String> {
	let mut files = Vec::new();
	collect_files(skill_dir, skill_dir, &mut files)?;

	// Sort by relative path for deterministic hashing
	files.sort_by(|a, b| a.0.cmp(&b.0));

	let mut hasher = Sha256::new();
	for (relative_path, content) in files {
		// Include the path in the hash so renames are detected
		hasher.update(relative_path);
		hasher.update(&content);
	}

	Ok(format!("{:x}", hasher.finalize()))
}

fn collect_files(
	base: &Path,
	current: &Path,
	results: &mut Vec<(String, Vec<u8>)>,
) -> Result<()> {
	for entry in WalkDir::new(current)
		.follow_links(false)
		.into_iter()
		.filter_entry(|e| {
			// Skip .git and node_modules directories entirely
			let name = e.file_name().to_string_lossy();
			name != ".git" && name != "node_modules"
		})
		.filter_map(|e| e.ok())
	{
		let path = entry.path();

		// Skip the root directory itself
		if path == base {
			continue;
		}

		if path.is_file() {
			let relative = path.strip_prefix(base)?;
			let content = std::fs::read(path)?;
			// Normalize path separators to forward slashes (for consistency across platforms)
			let relative_str = relative.to_string_lossy().replace('\\', "/");
			results.push((relative_str, content));
		}
		// Note: WalkDir already handles recursion into subdirectories
		// No need to call collect_files recursively here
	}

	Ok(())
}

#[cfg(test)]
mod tests {
	use super::*;
	use std::fs;
	use tempfile::TempDir;

	#[test]
	fn test_compute_skill_folder_hash_determinism() {
		let dir = TempDir::new().unwrap();
		let skill_dir = dir.path().join("my-skill");
		fs::create_dir(&skill_dir).unwrap();
		fs::write(
			skill_dir.join("SKILL.md"),
			"---\nname: test\ndescription: test\n---\n# Test\n",
		)
		.unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir).unwrap();
		let hash2 = compute_skill_folder_hash(&skill_dir).unwrap();
		assert_eq!(hash1, hash2);
		assert!(hash1.len() == 64); // SHA-256 produces 64 hex characters
		assert!(hash1.chars().all(|c| c.is_ascii_hexdigit()));
	}

	#[test]
	fn test_hash_changes_on_content_change() {
		let dir = TempDir::new().unwrap();
		let skill_dir = dir.path().join("my-skill");
		fs::create_dir(&skill_dir).unwrap();
		fs::write(skill_dir.join("SKILL.md"), "version 1").unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir).unwrap();

		fs::write(skill_dir.join("SKILL.md"), "version 2").unwrap();

		let hash2 = compute_skill_folder_hash(&skill_dir).unwrap();
		assert_ne!(hash1, hash2);
	}

	#[test]
	fn test_hash_changes_on_file_addition() {
		let dir = TempDir::new().unwrap();
		let skill_dir = dir.path().join("my-skill");
		fs::create_dir(&skill_dir).unwrap();
		fs::write(skill_dir.join("SKILL.md"), "content").unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir).unwrap();

		fs::write(skill_dir.join("extra.txt"), "extra file").unwrap();

		let hash2 = compute_skill_folder_hash(&skill_dir).unwrap();
		assert_ne!(hash1, hash2);
	}

	#[test]
	fn test_hash_changes_on_file_rename() {
		let dir = TempDir::new().unwrap();

		let skill_dir1 = dir.path().join("skill-v1");
		fs::create_dir(&skill_dir1).unwrap();
		fs::write(skill_dir1.join("old-name.md"), "content").unwrap();

		let skill_dir2 = dir.path().join("skill-v2");
		fs::create_dir(&skill_dir2).unwrap();
		fs::write(skill_dir2.join("new-name.md"), "content").unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir1).unwrap();
		let hash2 = compute_skill_folder_hash(&skill_dir2).unwrap();
		assert_ne!(hash1, hash2);
	}

	#[test]
	fn test_hash_includes_nested_files() {
		let dir = TempDir::new().unwrap();
		let skill_dir = dir.path().join("my-skill");
		fs::create_dir_all(skill_dir.join("sub")).unwrap();
		fs::write(skill_dir.join("SKILL.md"), "root").unwrap();
		fs::write(skill_dir.join("sub/helper.md"), "nested").unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir).unwrap();

		// Changing nested file should change hash
		fs::write(skill_dir.join("sub/helper.md"), "changed").unwrap();

		let hash2 = compute_skill_folder_hash(&skill_dir).unwrap();
		assert_ne!(hash1, hash2);
	}

	#[test]
	fn test_hash_ignores_git_and_node_modules() {
		let dir = TempDir::new().unwrap();
		let skill_dir = dir.path().join("my-skill");
		fs::create_dir(&skill_dir).unwrap();
		fs::write(skill_dir.join("SKILL.md"), "content").unwrap();

		let hash1 = compute_skill_folder_hash(&skill_dir).unwrap();

		// Adding files in .git and node_modules should NOT change hash
		fs::create_dir_all(skill_dir.join(".git")).unwrap();
		fs::write(skill_dir.join(".git/HEAD"), "ref: refs/heads/main").unwrap();
		fs::create_dir_all(skill_dir.join("node_modules/foo")).unwrap();
		fs::write(skill_dir.join("node_modules/foo/index.js"), "noop").unwrap();

		let hash2 = compute_skill_folder_hash(&skill_dir).unwrap();
		assert_eq!(hash1, hash2);
	}
}