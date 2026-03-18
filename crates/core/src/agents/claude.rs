use crate::registry::descriptor::*;
use std::path::{Path, PathBuf};

pub fn global_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".claude.json")
}
pub fn project_path(root: &Path) -> PathBuf {
	root.join(".mcp.json")
}
pub fn global_skills_path() -> PathBuf {
	dirs::home_dir().unwrap().join(".claude/skills")
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "claude",
	display_name: "Claude Code",
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
	skills_dir: Some(".claude/skills"),
	global_skills_path: Some(global_skills_path),
	cli_name: "claude",
	validate_args: &["--version"],
	project_markers: &[".claude", ".mcp.json"],
};
