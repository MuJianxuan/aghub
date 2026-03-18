use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir()
		.unwrap()
		.join(".gemini/antigravity/mcp_config.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".gemini/antigravity/mcp_config.json")
}
pub fn global_skills_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".agent/skills")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "antigravity",
	display_name: "Antigravity",
	config_format: ConfigFormat::None,
	server_key: "",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: false,
		mcp_remote: false,
		mcp_enable_disable: false,
		sub_agents: false,
		skills: true,
	},
	skills_dir: Some(".agent/skills"),
	global_skills_path: Some(global_skills_path),
	cli_name: "antigravity",
	validate_args: &["--version"],
	project_markers: &[".gemini/antigravity"],
};
