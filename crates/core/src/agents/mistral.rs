use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".vibe/mcp.toml")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".vibe/mcp.toml")
}
pub fn global_skills_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".vibe/skills")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "mistral",
	display_name: "Mistral Le Chat",
	config_format: ConfigFormat::Toml,
	server_key: "mcp_servers",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: true,
	},
	skills_dir: Some(".vibe/skills"),
	global_skills_path: Some(global_skills_path),
	cli_name: "mistral",
	validate_args: &["--version"],
	project_markers: &[".vibe"],
};
