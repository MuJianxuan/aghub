use crate::{
	errors::Result, format::toml_format, models::AgentConfig,
	skills::discovery::load_skills_from_dir,
};
use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::process::Command;

use super::AgentAdapter;

thread_local! {
	static CODEX_SKILLS_PATH_OVERRIDE: RefCell<Option<PathBuf>> = const { RefCell::new(None) };
}

pub fn set_thread_local_codex_skills_path(path: Option<PathBuf>) {
	CODEX_SKILLS_PATH_OVERRIDE.with(|p| *p.borrow_mut() = path);
}

fn get_codex_skills_path() -> PathBuf {
	if let Some(path) = CODEX_SKILLS_PATH_OVERRIDE.with(|p| p.borrow().clone())
	{
		return path;
	}
	dirs::home_dir()
		.unwrap_or_default()
		.join(".codex")
		.join("skills")
}

pub struct TomlAdapter {
	name: &'static str,
	global_path_fn: fn() -> PathBuf,
	project_path_fn: fn(&Path) -> PathBuf,
}

impl TomlAdapter {
	pub fn new() -> Self {
		Self {
			name: "codex",
			global_path_fn: crate::paths::codex_global_path,
			project_path_fn: crate::paths::codex_project_path,
		}
	}

	pub fn with_paths(
		name: &'static str,
		global_path_fn: fn() -> PathBuf,
		project_path_fn: fn(&Path) -> PathBuf,
	) -> Self {
		Self {
			name,
			global_path_fn,
			project_path_fn,
		}
	}
}

impl Default for TomlAdapter {
	fn default() -> Self {
		Self::new()
	}
}

impl AgentAdapter for TomlAdapter {
	fn name(&self) -> &'static str {
		self.name
	}

	fn global_config_path(&self) -> PathBuf {
		(self.global_path_fn)()
	}

	fn project_config_path(&self, project_root: &Path) -> PathBuf {
		(self.project_path_fn)(project_root)
	}

	fn parse_config(&self, content: &str) -> Result<AgentConfig> {
		let mut config = toml_format::parse(content)?;
		let skills_dir = get_codex_skills_path();
		config.skills = load_skills_from_dir(&skills_dir);
		Ok(config)
	}

	fn serialize_config(
		&self,
		config: &AgentConfig,
		original_content: Option<&str>,
	) -> Result<String> {
		toml_format::serialize(config, original_content)
	}

	fn validate_command(&self, config_path: &Path) -> Command {
		let mut cmd = Command::new(self.name);
		cmd.arg("--config").arg(config_path);
		cmd.arg("--version");
		cmd
	}

	fn supports_mcp_enable_disable(&self) -> bool {
		false
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::models::{McpServer, McpTransport};

	#[test]
	fn test_parse_toml_config() {
		let content = r#"
model = "o3"

[mcp_servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]

[mcp_servers.chrome]
command = "/usr/local/bin/chrome-mcp"
env = { DISPLAY = ":0" }
"#;
		let adapter = TomlAdapter::new();
		let config = adapter.parse_config(content).unwrap();
		assert_eq!(config.mcps.len(), 2);
		let fs = config.mcps.iter().find(|m| m.name == "filesystem").unwrap();
		match &fs.transport {
			McpTransport::Stdio { command, args, .. } => {
				assert_eq!(command, "npx");
				assert_eq!(args.len(), 3);
			}
			_ => panic!("Expected Stdio"),
		}
	}

	#[test]
	fn test_roundtrip_preserves_extra_fields() {
		let original = r#"
model_provider = "custom"
model = "gpt-5.4"

[mcp_servers.old]
command = "old-cmd"
"#;
		let adapter = TomlAdapter::new();
		let config = adapter.parse_config(original).unwrap();
		let mut updated = config;
		updated.mcps.clear();
		updated.mcps.push(McpServer::new(
			"new-mcp",
			McpTransport::stdio("new-cmd", vec![]),
		));
		let output =
			adapter.serialize_config(&updated, Some(original)).unwrap();
		assert!(output.contains("model_provider"));
		assert!(output.contains("gpt-5.4"));
		assert!(!output.contains("[mcp_servers.old]"));
		assert!(output.contains("[mcp_servers.new-mcp]"));
	}
}
