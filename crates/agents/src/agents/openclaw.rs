use crate::descriptor::*;
use std::path::{Path, PathBuf};

fn mcp_global_path() -> PathBuf {
	dirs::home_dir()
		.unwrap_or_else(|| std::path::PathBuf::from(""))
		.join(".openclaw/workspace/config/mcporter.json")
}
fn mcp_project_path(root: &Path) -> PathBuf {
	root.join(".openclaw/openclaw.json")
}
fn global_data_dir() -> PathBuf {
	dirs::home_dir()
		.unwrap_or_else(|| std::path::PathBuf::from(""))
		.join(".openclaw")
}
fn load_mcps(
	project_root: Option<&Path>,
	scope: crate::ResourceScope,
) -> crate::Result<Vec<crate::McpServer>> {
	load_scoped_mcps(
		project_root,
		scope,
		mcp_global_path,
		mcp_project_path,
		mcp_strategy::parse_json_map_mcp_servers,
	)
}
fn save_mcps(
	project_root: Option<&Path>,
	scope: crate::ResourceScope,
	mcps: &[crate::McpServer],
) -> crate::Result<()> {
	save_scoped_mcps(
		project_root,
		scope,
		mcps,
		mcp_global_path,
		mcp_project_path,
		mcp_strategy::serialize_json_map_mcp_servers,
	)
}

/// Return the global skills directories for OpenClaw, checking fallback dirs.
///
/// Priority: `.openclaw` → `.clawdbot` → `.moltbot`, defaulting to `.openclaw`.
/// The `exists` parameter allows dependency injection for testing.
pub fn get_openclaw_skills_dirs(
	home: &Path,
	exists: impl Fn(&Path) -> bool,
) -> Vec<PathBuf> {
	for dir in [".openclaw", ".clawdbot", ".moltbot"] {
		if exists(&home.join(dir)) {
			return vec![home.join(dir).join("skills")];
		}
	}
	vec![home.join(".openclaw/skills")]
}

fn global_skills_paths() -> Vec<PathBuf> {
	let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from(""));
	let mut paths = get_openclaw_skills_dirs(&home, |p| p.exists());

	// Dynamic discovery: which openclaw → canonicalize → parent/skills
	// This allows finding skills from npm global installation or other symlinked locations
	if let Ok(cli_path) = which::which("openclaw") {
		if let Ok(real_path) = cli_path.canonicalize() {
			// real_path might be: /opt/homebrew/lib/node_modules/openclaw/openclaw.mjs
			// skills dir should be: /opt/homebrew/lib/node_modules/openclaw/skills/
			if let Some(parent) = real_path.parent() {
				let npm_skills_dir = parent.join("skills");
				if npm_skills_dir.exists() {
					paths.push(npm_skills_dir);
				}
			}
		}
	}

	paths
}
fn project_skills_paths(root: &Path) -> Vec<PathBuf> {
	vec![root.join("skills")]
}

pub const DESCRIPTOR: AgentDescriptor = AgentDescriptor {
	id: "openclaw",
	display_name: "OpenClaw",
	mcp_parse_config: Some(mcp_strategy::parse_json_map_mcp_servers),
	mcp_serialize_config: Some(mcp_strategy::serialize_json_map_mcp_servers),
	load_mcps,
	save_mcps,
	mcp_global_path,
	mcp_project_path,
	global_data_dir,
	capabilities: Capabilities {
		mcp_stdio: true,
		mcp_remote: true,
		mcp_enable_disable: false,
		skills: true,
		universal_skills: false,
	},
	global_skills_paths: Some(global_skills_paths),
	project_skills_paths: Some(project_skills_paths),
	cli_name: "openclaw",
	validate_args: &["--version"],
	project_markers: &[".openclaw"],
	skills_cli_name: Some("openclaw"),
};
