use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".config/zed/settings.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".zed/settings.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "zed",
	display_name: "Zed",
	config_format: ConfigFormat::JsonMap,
	server_key: "context_servers",
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
	cli_name: "zed",
	validate_args: &["--version"],
	project_markers: &[".zed"],
};
