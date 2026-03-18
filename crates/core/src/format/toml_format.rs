use crate::{
	errors::{ConfigError, Result},
	models::{AgentConfig, McpServer, McpTransport},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Default, Serialize, Deserialize)]
struct TomlConfig {
	#[serde(default)]
	mcp_servers: HashMap<String, TomlMcpServer>,
	#[serde(flatten)]
	extra: toml::map::Map<String, toml::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TomlMcpServer {
	command: String,
	#[serde(default, skip_serializing_if = "Vec::is_empty")]
	args: Vec<String>,
	#[serde(default, skip_serializing_if = "Option::is_none")]
	env: Option<HashMap<String, String>>,
}

pub fn parse(content: &str) -> Result<AgentConfig> {
	let toml_config: TomlConfig = toml::from_str(content).map_err(|e| {
		ConfigError::InvalidConfig(format!(
			"Failed to parse TOML config: {}",
			e
		))
	})?;

	let mut config = AgentConfig::new();

	for (name, server) in toml_config.mcp_servers {
		config.mcps.push(McpServer {
			name,
			enabled: true,
			transport: McpTransport::Stdio {
				command: server.command,
				args: server.args,
				env: server.env,
				timeout: None,
			},
			timeout: None,
		});
	}

	Ok(config)
}

pub fn serialize(
	config: &AgentConfig,
	original_content: Option<&str>,
) -> Result<String> {
	let mut toml_config = if let Some(content) = original_content {
		if content.trim().is_empty() {
			TomlConfig::default()
		} else {
			toml::from_str::<TomlConfig>(content).map_err(|e| {
				ConfigError::InvalidConfig(format!(
					"Failed to parse existing config: {}",
					e
				))
			})?
		}
	} else {
		TomlConfig::default()
	};

	toml_config.mcp_servers.clear();

	for mcp in &config.mcps {
		if !mcp.enabled {
			continue;
		}
		if let McpTransport::Stdio {
			command, args, env, ..
		} = &mcp.transport
		{
			toml_config.mcp_servers.insert(
				mcp.name.clone(),
				TomlMcpServer {
					command: command.clone(),
					args: args.clone(),
					env: env.clone(),
				},
			);
		}
		// SSE/HTTP not supported in TOML format
	}

	toml::to_string_pretty(&toml_config)
		.map_err(|e| ConfigError::InvalidConfig(e.to_string()))
}
