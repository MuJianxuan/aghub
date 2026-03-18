use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".codex/config.toml")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".codex/config.toml")
}
pub fn global_skills_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".codex/skills")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "codex",
	display_name: "OpenAI Codex",
	config_format: ConfigFormat::Toml,
	server_key: "mcp_servers",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: false,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: true,
	},
	skills_dir: Some(".codex/skills"),
	global_skills_path: Some(global_skills_path),
	cli_name: "codex",
	validate_args: &["--version"],
	project_markers: &[".codex"],
};
