use std::path::{Path, PathBuf};

/// How the agent stores MCP configuration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigFormat {
	/// {"mcpServers": {...}} or {"servers": {...}}
	JsonMap,
	/// {"mcp": {...}} with local/remote entries (OpenCode/Crush)
	JsonOpenCode,
	/// {"mcp_servers": [...]} array format
	JsonList,
	/// [mcp_servers.name] TOML format
	Toml,
	/// No MCP config file
	None,
}

/// Agent capabilities
#[derive(Debug, Clone, Copy)]
pub struct Capabilities {
	pub mcp_stdio: bool,
	pub mcp_remote: bool,
	pub mcp_enable_disable: bool,
	pub sub_agents: bool,
	pub skills: bool,
}

/// Static descriptor for an agent — one per agent, declared in agents/*.rs
pub struct AgentDescriptor {
	pub id: &'static str,
	pub display_name: &'static str,
	pub config_format: ConfigFormat,
	pub server_key: &'static str,
	pub global_path: fn() -> PathBuf,
	pub project_path: fn(&Path) -> PathBuf,
	pub capabilities: Capabilities,
	/// Relative path under home dir for skills (e.g. ".claude/skills")
	pub skills_dir: Option<&'static str>,
	/// Function returning the global skills path (if skills supported)
	pub global_skills_path: Option<fn() -> PathBuf>,
	pub cli_name: &'static str,
	pub validate_args: &'static [&'static str],
	/// Directory/file markers that indicate this agent's project root
	pub project_markers: &'static [&'static str],
}
