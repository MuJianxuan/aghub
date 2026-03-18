use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".mcp.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "aider",
	display_name: "Aider",
	config_format: ConfigFormat::JsonMap,
	server_key: "mcpServers",
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
	cli_name: "aider",
	validate_args: &["--version"],
	project_markers: &[".mcp.json"],
};
