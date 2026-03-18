use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".junie/mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".junie/mcp.json")
}
pub fn global_skills_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".junie/skills")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "junie",
	display_name: "Junie",
	config_format: ConfigFormat::JsonMap,
	server_key: "mcpServers",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: true,
	},
	skills_dir: Some(".junie/skills"),
	global_skills_path: Some(global_skills_path),
	cli_name: "junie",
	validate_args: &["--version"],
	project_markers: &[".junie"],
};
