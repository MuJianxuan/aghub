use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".augmentcode/mcp.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".augmentcode/mcp.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "augmentcode",
	display_name: "AugmentCode",
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
	cli_name: "augmentcode",
	validate_args: &["--version"],
	project_markers: &[".augmentcode"],
};
