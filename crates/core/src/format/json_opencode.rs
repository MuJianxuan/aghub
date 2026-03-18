use crate::{
	errors::{ConfigError, Result},
	models::{AgentConfig, McpServer, McpTransport},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Default, Deserialize)]
struct OpenCodeConfig {
	#[serde(rename = "$schema", default)]
	schema: Option<String>,
	#[serde(default)]
	mcp: HashMap<String, OpenCodeMcpEntry>,
	#[serde(flatten)]
	extra: serde_json::Map<String, serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct OpenCodeMcpEntry {
	#[serde(rename = "type")]
	server_type: Option<String>,
	command: Option<Vec<String>>,
	url: Option<String>,
	#[serde(default = "default_true")]
	enabled: bool,
	#[serde(alias = "env", default)]
	environment: Option<HashMap<String, String>>,
	headers: Option<HashMap<String, String>>,
	timeout: Option<u64>,
}

#[derive(Debug, Serialize)]
struct OpenCodeMcpOutput {
	#[serde(rename = "type")]
	server_type: String,
	#[serde(skip_serializing_if = "Option::is_none")]
	command: Option<Vec<String>>,
	#[serde(skip_serializing_if = "Option::is_none")]
	url: Option<String>,
	enabled: bool,
	#[serde(skip_serializing_if = "Option::is_none")]
	environment: Option<HashMap<String, String>>,
	#[serde(skip_serializing_if = "Option::is_none")]
	headers: Option<HashMap<String, String>>,
	#[serde(skip_serializing_if = "Option::is_none")]
	timeout: Option<u64>,
}

#[derive(Debug, Default, Serialize)]
struct OpenCodeConfigOutput {
	#[serde(rename = "$schema", skip_serializing_if = "Option::is_none")]
	schema: Option<String>,
	mcp: HashMap<String, OpenCodeMcpOutput>,
	#[serde(flatten)]
	extra: serde_json::Map<String, serde_json::Value>,
}

fn default_true() -> bool {
	true
}

pub fn parse(content: &str) -> Result<AgentConfig> {
	let oc: OpenCodeConfig = serde_json::from_str(content)?;
	let mut config = AgentConfig::new();

	for (name, entry) in oc.mcp {
		let is_remote = entry.server_type.as_deref() == Some("remote")
			|| (entry.server_type.is_none() && entry.url.is_some());
		let transport = if is_remote {
			McpTransport::StreamableHttp {
				url: entry.url.unwrap_or_default(),
				headers: entry.headers,
				timeout: entry.timeout,
			}
		} else {
			let cmd = entry.command.unwrap_or_default();
			let (command, args) = if cmd.is_empty() {
				(String::new(), vec![])
			} else {
				(cmd[0].clone(), cmd[1..].to_vec())
			};
			McpTransport::Stdio {
				command,
				args,
				env: entry.environment,
				timeout: entry.timeout,
			}
		};
		config.mcps.push(McpServer {
			name,
			enabled: entry.enabled,
			transport,
			timeout: None,
		});
	}

	Ok(config)
}

pub fn serialize(
	config: &AgentConfig,
	original_content: Option<&str>,
) -> Result<String> {
	let original: OpenCodeConfig = original_content
		.filter(|c| !c.trim().is_empty())
		.and_then(|c| serde_json::from_str(c).ok())
		.unwrap_or_default();

	let mut out = OpenCodeConfigOutput {
		schema: original.schema,
		mcp: HashMap::new(),
		extra: original.extra,
	};

	for mcp in &config.mcps {
		if !mcp.enabled {
			continue;
		}
		let entry = match &mcp.transport {
			McpTransport::Stdio {
				command,
				args,
				env,
				timeout,
				..
			} => {
				let mut cmd = vec![command.clone()];
				cmd.extend(args.iter().cloned());
				OpenCodeMcpOutput {
					server_type: "local".to_string(),
					command: Some(cmd),
					url: None,
					enabled: true,
					environment: env.clone(),
					headers: None,
					timeout: *timeout,
				}
			}
			McpTransport::Sse {
				url,
				headers,
				timeout,
				..
			}
			| McpTransport::StreamableHttp {
				url,
				headers,
				timeout,
				..
			} => OpenCodeMcpOutput {
				server_type: "remote".to_string(),
				command: None,
				url: Some(url.clone()),
				enabled: true,
				environment: None,
				headers: headers.clone(),
				timeout: *timeout,
			},
		};
		out.mcp.insert(mcp.name.clone(), entry);
	}

	serde_json::to_string_pretty(&out).map_err(ConfigError::Json)
}
