use crate::{
	errors::{ConfigError, Result},
	models::{AgentConfig, McpServer, McpTransport},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Map-based MCP server configuration ({"mcpServers": {...}} style)
#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct MapMcpServer {
	#[serde(rename = "type", default)]
	pub server_type: Option<String>,
	#[serde(skip_serializing_if = "Option::is_none")]
	pub command: Option<String>,
	#[serde(default, skip_serializing_if = "Vec::is_empty")]
	pub args: Vec<String>,
	#[serde(skip_serializing_if = "Option::is_none")]
	pub env: Option<HashMap<String, String>>,
	#[serde(skip_serializing_if = "Option::is_none")]
	pub url: Option<String>,
	#[serde(skip_serializing_if = "Option::is_none")]
	pub headers: Option<HashMap<String, String>>,
}

pub fn parse(content: &str, server_key: &str) -> Result<AgentConfig> {
	let root: serde_json::Value = serde_json::from_str(content)?;
	let mut config = AgentConfig::new();

	let servers_map = root
		.get(server_key)
		.and_then(|v| v.as_object())
		.cloned()
		.unwrap_or_default();

	for (name, mcp_val) in servers_map {
		let mcp: MapMcpServer =
			serde_json::from_value(mcp_val).unwrap_or_else(|_| MapMcpServer {
				server_type: None,
				command: None,
				args: vec![],
				env: None,
				url: None,
				headers: None,
			});
		let transport = match mcp.server_type.as_deref() {
			Some("stdio") => McpTransport::Stdio {
				command: mcp.command.unwrap_or_default(),
				args: mcp.args,
				env: mcp.env,
				timeout: None,
			},
			Some("sse") => McpTransport::Sse {
				url: mcp.url.unwrap_or_default(),
				headers: mcp.headers,
				timeout: None,
			},
			Some("http") => McpTransport::StreamableHttp {
				url: mcp.url.unwrap_or_default(),
				headers: mcp.headers,
				timeout: None,
			},
			None | Some(_) => {
				if let Some(command) = mcp.command {
					McpTransport::Stdio {
						command,
						args: mcp.args,
						env: mcp.env,
						timeout: None,
					}
				} else if let Some(url) = mcp.url {
					let is_sse = {
						let path = url.split('?').next().unwrap_or(&url);
						path.split('/')
							.any(|seg| seg.eq_ignore_ascii_case("sse"))
					};
					if is_sse {
						McpTransport::Sse {
							url,
							headers: mcp.headers,
							timeout: None,
						}
					} else {
						McpTransport::StreamableHttp {
							url,
							headers: mcp.headers,
							timeout: None,
						}
					}
				} else {
					continue;
				}
			}
		};
		config.mcps.push(McpServer {
			name,
			enabled: true,
			transport,
			timeout: None,
		});
	}

	Ok(config)
}

pub fn serialize(
	config: &AgentConfig,
	original_content: Option<&str>,
	server_key: &str,
) -> Result<String> {
	let mut root: serde_json::Value = if let Some(content) = original_content {
		if content.trim().is_empty() {
			serde_json::Value::Object(serde_json::Map::new())
		} else {
			serde_json::from_str(content).map_err(|e| {
				ConfigError::InvalidConfig(format!(
					"Failed to parse existing config: {}",
					e
				))
			})?
		}
	} else {
		serde_json::Value::Object(serde_json::Map::new())
	};

	let mut servers_map = serde_json::Map::new();

	for mcp in &config.mcps {
		if !mcp.enabled {
			continue;
		}
		let map_mcp = match &mcp.transport {
			McpTransport::Stdio {
				command, args, env, ..
			} => MapMcpServer {
				server_type: Some("stdio".to_string()),
				command: Some(command.clone()),
				args: args.clone(),
				env: env.clone(),
				url: None,
				headers: None,
			},
			McpTransport::Sse { url, headers, .. } => MapMcpServer {
				server_type: Some("sse".to_string()),
				command: None,
				args: vec![],
				env: None,
				url: Some(url.clone()),
				headers: headers.clone(),
			},
			McpTransport::StreamableHttp { url, headers, .. } => MapMcpServer {
				server_type: Some("http".to_string()),
				command: None,
				args: vec![],
				env: None,
				url: Some(url.clone()),
				headers: headers.clone(),
			},
		};
		servers_map.insert(
			mcp.name.clone(),
			serde_json::to_value(map_mcp).map_err(ConfigError::Json)?,
		);
	}

	if let serde_json::Value::Object(ref mut obj) = root {
		obj.insert(
			server_key.to_string(),
			serde_json::Value::Object(servers_map),
		);
	}

	serde_json::to_string_pretty(&root).map_err(ConfigError::Json)
}
