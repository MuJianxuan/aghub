use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir()
		.unwrap()
		.join(".firebase/dataconnect/mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".firebase/dataconnect/mcp.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "firebase",
	display_name: "Firebase Genkit",
	config_format: ConfigFormat::JsonMap,
	server_key: "mcpServers",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: false,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: false,
	},
	skills_dir: None,
	global_skills_path: None,
	cli_name: "firebase",
	validate_args: &["--version"],
	project_markers: &[".firebase"],
};
