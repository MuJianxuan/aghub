use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".trae/mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".trae/mcp.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "trae",
	display_name: "Trae",
	config_format: ConfigFormat::None,
	server_key: "",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: false,
		mcp_remote: false,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: false,
	},
	skills_dir: None,
	global_skills_path: None,
	cli_name: "trae",
	validate_args: &["--version"],
	project_markers: &[".trae"],
};
