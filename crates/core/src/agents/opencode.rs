use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	#[cfg(any(target_os = "macos", target_os = "linux"))]
	return dirs::home_dir()
		.unwrap()
		.join(".config/opencode/opencode.json");
	#[cfg(target_os = "windows")]
	return dirs::data_dir().unwrap().join("opencode/opencode.json");
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".opencode/settings.json")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "opencode",
	display_name: "OpenCode",
	config_format: ConfigFormat::JsonOpenCode,
	server_key: "mcp",
	global_path,
	project_path,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: true,
		sub_agents: true,
		skills: true,
	},
	skills_dir: Some(".opencode/skills"),
	global_skills_path: None,
	cli_name: "opencode",
	validate_args: &["--version"],
	project_markers: &[".opencode"],
};
