use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".crush/mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".crush/mcp.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "crush",
	display_name: "Crush",
	config_format: ConfigFormat::JsonOpenCode,
	server_key: "mcp",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: true,
		sub_agents: false,
		skills: false,
	},
	skills_dir: None,
	global_skills_path: None,
	cli_name: "crush",
	validate_args: &["--version"],
	project_markers: &[".crush"],
};
