use crate::{
	adapters::AgentAdapter,
	errors::Result,
	format::{json_list, json_map, json_opencode, toml_format},
	models::AgentConfig,
	registry::descriptor::{AgentDescriptor, ConfigFormat},
	skills::discovery::load_skills_from_dir,
};
use std::cell::RefCell;
use std::path::{Path, PathBuf};
use std::process::Command;

thread_local! {
	static SKILLS_PATH_OVERRIDE: RefCell<Option<(String, PathBuf)>> = const { RefCell::new(None) };
}

/// Override the skills path for a specific agent (for testing)
pub fn set_skills_path_override(agent_id: &str, path: Option<PathBuf>) {
	SKILLS_PATH_OVERRIDE.with(|p| {
		*p.borrow_mut() = path.map(|path| (agent_id.to_string(), path));
	});
}

fn get_skills_path(descriptor: &AgentDescriptor) -> Option<PathBuf> {
	// Check thread-local override first
	if let Some((id, path)) = SKILLS_PATH_OVERRIDE.with(|p| p.borrow().clone())
	{
		if id == descriptor.id {
			return Some(path);
		}
	}
	// Check env var for claude
	if descriptor.id == "claude" {
		if let Ok(p) = std::env::var("CLAUDE_SKILLS_PATH") {
			return Some(PathBuf::from(p));
		}
	}
	// Use descriptor's global_skills_path
	descriptor.global_skills_path.map(|f| f())
}

impl AgentAdapter for &'static AgentDescriptor {
	fn name(&self) -> &'static str {
		self.id
	}

	fn global_config_path(&self) -> PathBuf {
		(self.global_path)()
	}

	fn project_config_path(&self, project_root: &Path) -> PathBuf {
		(self.project_path)(project_root)
	}

	fn parse_config(&self, content: &str) -> Result<AgentConfig> {
		let mut config = match self.config_format {
			ConfigFormat::JsonMap => json_map::parse(content, self.server_key)?,
			ConfigFormat::JsonOpenCode => json_opencode::parse(content)?,
			ConfigFormat::JsonList => json_list::parse(content)?,
			ConfigFormat::Toml => toml_format::parse(content)?,
			ConfigFormat::None => AgentConfig::new(),
		};

		// Load skills from the agent's skills directory
		if self.capabilities.skills {
			if let Some(skills_path) = get_skills_path(self) {
				config.skills = load_skills_from_dir(&skills_path);
			}
		}

		Ok(config)
	}

	fn serialize_config(
		&self,
		config: &AgentConfig,
		original_content: Option<&str>,
	) -> Result<String> {
		match self.config_format {
			ConfigFormat::JsonMap => {
				json_map::serialize(config, original_content, self.server_key)
			}
			ConfigFormat::JsonOpenCode => {
				json_opencode::serialize(config, original_content)
			}
			ConfigFormat::JsonList => {
				json_list::serialize(config, original_content)
			}
			ConfigFormat::Toml => {
				toml_format::serialize(config, original_content)
			}
			ConfigFormat::None => Ok(String::new()),
		}
	}

	fn validate_command(&self, config_path: &Path) -> Command {
		let mut cmd = Command::new(self.cli_name);
		for arg in self.validate_args {
			cmd.arg(arg);
		}
		cmd.arg(config_path);
		cmd
	}

	fn supports_mcp_enable_disable(&self) -> bool {
		self.capabilities.mcp_enable_disable
	}
}
