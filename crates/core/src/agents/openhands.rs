use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".openhands/config.toml")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".openhands/config.toml")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "openhands",
	display_name: "OpenHands",
	config_format: ConfigFormat::Toml,
	server_key: "mcp_servers",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: false,
	},
	skills_dir: None,
	global_skills_path: None,
	cli_name: "openhands",
	validate_args: &["--version"],
	project_markers: &[".openhands"],
};
