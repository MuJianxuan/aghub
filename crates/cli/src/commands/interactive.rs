use crate::ResourceType;
use aghub_core::{
    manager::ConfigManager,
    models::{McpServer, McpTransport, Skill, SubAgent},
};
use anyhow::{bail, Result};
use colored::*;
use inquire::{Confirm, MultiSelect, Select, Text};
use std::collections::HashMap;

/// Run the interactive CLI wizard
pub fn run_interactive(manager: &mut ConfigManager) -> Result<()> {
    // Initialize empty config if none exists
    manager.init_empty_config();

    println!("\n{}", "═══ AgentCtl Interactive Mode ═══".bold().cyan());
    println!("{}", format!("Agent: {} | Scope: {}",
        manager.agent_name().yellow(),
        if manager.config_path().to_string_lossy().contains(".claude.json") ||
           manager.config_path().to_string_lossy().contains("opencode.json") {
            "global".yellow()
        } else {
            "project".yellow()
        }
    ).dimmed());
    println!("{}", format!("Config: {}", manager.config_path().display()).dimmed());
    println!();

    loop {
        let choices = vec![
            "📋 List resources",
            "➕ Add resource",
            "✏️  Update resource",
            "🗑️  Delete resource",
            "🔘 Enable/Disable resource",
            "👀 View resource details",
            "💾 Save & Exit",
        ];

        let choice = Select::new("What would you like to do?", choices)
            .prompt()?;

        match choice {
            "📋 List resources" => list_resources(manager)?,
            "➕ Add resource" => add_resource(manager)?,
            "✏️  Update resource" => update_resource(manager)?,
            "🗑️  Delete resource" => delete_resource(manager)?,
            "🔘 Enable/Disable resource" => toggle_resource(manager)?,
            "👀 View resource details" => describe_resource(manager)?,
            "💾 Save & Exit" => {
                println!("\n{}", "Goodbye!".green().bold());
                break;
            }
            _ => {}
        }

        println!();
    }

    Ok(())
}

fn select_resource_type() -> Result<ResourceType> {
    let options = [
        ("🛠️  Skill", ResourceType::Skills),
        ("🔌 MCP Server", ResourceType::Mcps),
        ("🤖 Sub-agent", ResourceType::SubAgents),
    ];

    let selected = Select::new(
        "Select resource type:",
        options.iter().map(|(name, _)| *name).collect()
    ).prompt()?;

    Ok(options.iter().find(|(name, _)| *name == selected).unwrap().1)
}

fn list_resources(manager: &ConfigManager) -> Result<()> {
    let config = match manager.config() {
        Some(c) => c,
        None => {
            println!("{}", "No configuration loaded.".yellow());
            return Ok(());
        }
    };

    println!("\n{}", "═══ Resources ═══".bold());

    // Skills
    if !config.skills.is_empty() {
        println!("\n{}", "🛠️  Skills:".bold());
        for skill in &config.skills {
            let status = if skill.enabled {
                "●".green()
            } else {
                "●".red()
            };
            println!("  {} {}", status, skill.name);
            if let Some(desc) = &skill.description {
                println!("     {}", desc.dimmed());
            }
        }
    }

    // MCPs
    if !config.mcps.is_empty() {
        println!("\n{}", "🔌 MCP Servers:".bold());
        for mcp in &config.mcps {
            let status = if mcp.enabled {
                "●".green()
            } else {
                "●".red()
            };
            let transport_type = match &mcp.transport {
                McpTransport::Stdio { .. } => "stdio",
                McpTransport::Sse { .. } => "sse",
                McpTransport::StreamableHttp { .. } => "http",
            };
            println!("  {} {} ({})", status, mcp.name, transport_type.dimmed());
        }
    }

    // Sub-agents
    if !config.sub_agents.is_empty() {
        println!("\n{}", "🤖 Sub-agents:".bold());
        for agent in &config.sub_agents {
            let status = if agent.enabled {
                "●".green()
            } else {
                "●".red()
            };
            println!("  {} {}", status, agent.name);
            if let Some(model) = &agent.model {
                println!("     Model: {}", model.dimmed());
            }
        }
    }

    if config.skills.is_empty() && config.mcps.is_empty() && config.sub_agents.is_empty() {
        println!("{}", "No resources configured yet.".dimmed());
    }

    Ok(())
}

fn add_resource(manager: &mut ConfigManager) -> Result<()> {
    let resource_type = select_resource_type()?;

    match resource_type {
        ResourceType::Skills => add_skill(manager)?,
        ResourceType::Mcps => add_mcp(manager)?,
        ResourceType::SubAgents => add_sub_agent(manager)?,
    }

    Ok(())
}

fn add_skill(manager: &mut ConfigManager) -> Result<()> {
    println!("\n{}", "═══ Add Skill ═══".bold().cyan());

    // Ask for import method
    let import_method = Select::new(
        "How would you like to add the skill?",
        vec!["Import from file/directory", "Create manually"]
    ).prompt()?;

    if import_method == "Import from file/directory" {
        let path = Text::new("Enter path to skill (directory, .skill file, or SKILL.md):")
            .prompt()?;

        let path = std::path::PathBuf::from(path);
        if !path.exists() {
            println!("{}", "❌ Path does not exist.".red());
            return Ok(());
        }

        match manager.add_skill_from_path(&path) {
            Ok(skill) => {
                println!("\n{}", "✅ Skill added successfully!".green().bold());
                println!("{}", serde_json::to_string_pretty(&skill)?);
            }
            Err(e) => {
                println!("{} {}", "❌ Failed to add skill:".red(), e);
            }
        }
    } else {
        // Manual creation
        let name = Text::new("Skill name:")
            .with_help_message("e.g., my-custom-skill")
            .prompt()?;

        let description = Text::new("Description (optional):")
            .with_help_message("What does this skill do?")
            .prompt()?;
        let description = if description.is_empty() { None } else { Some(description) };

        let author = Text::new("Author (optional):")
            .prompt()?;
        let author = if author.is_empty() { None } else { Some(author) };

        let version = Text::new("Version (optional):")
            .with_help_message("e.g., 1.0.0")
            .prompt()?;
        let version = if version.is_empty() { None } else { Some(version) };

        let tools_input = Text::new("Tools (optional, comma-separated):")
            .with_help_message("e.g., tool1, tool2, tool3")
            .prompt()?;
        let tools: Vec<String> = tools_input
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        let skill = Skill {
            name,
            enabled: true,
            description,
            author,
            version,
            tools,
        };

        manager.add_skill(skill.clone())?;
        println!("\n{}", "✅ Skill added successfully!".green().bold());
        println!("{}", serde_json::to_string_pretty(&skill)?);
    }

    Ok(())
}

fn add_mcp(manager: &mut ConfigManager) -> Result<()> {
    println!("\n{}", "═══ Add MCP Server ═══".bold().cyan());

    let name = Text::new("MCP server name:")
        .with_help_message("e.g., filesystem, github, fetch")
        .prompt()?;

    let transport_type = Select::new(
        "Transport type:",
        vec!["stdio (command)", "streamable-http (URL)", "sse (URL, legacy)"]
    ).prompt()?;

    let transport = if transport_type.starts_with("stdio") {
        let command = Text::new("Command:")
            .with_help_message("e.g., npx -y @modelcontextprotocol/server-filesystem /path")
            .prompt()?;

        let parts: Vec<String> = command.split_whitespace().map(String::from).collect();
        if parts.is_empty() {
            bail!("Command cannot be empty");
        }

        let cmd = parts[0].clone();
        let args = parts.into_iter().skip(1).collect();

        // Optional env vars
        let add_env = Confirm::new("Add environment variables?")
            .with_default(false)
            .prompt()?;

        let env = if add_env {
            let mut env_map = HashMap::new();
            loop {
                let key = Text::new("Environment variable name (or press Enter to finish):")
                    .prompt()?;
                if key.is_empty() {
                    break;
                }
                let value = Text::new(&format!("Value for {}:", key)).prompt()?;
                env_map.insert(key, value);
            }
            if env_map.is_empty() { None } else { Some(env_map) }
        } else {
            None
        };

        McpTransport::Stdio { command: cmd, args, env, timeout: None }
    } else {
        let url = Text::new("URL:")
            .with_help_message("e.g., http://localhost:3000")
            .prompt()?;

        // Optional headers
        let add_headers = Confirm::new("Add HTTP headers?")
            .with_default(false)
            .prompt()?;

        let headers = if add_headers {
            let mut headers_map = HashMap::new();
            loop {
                let header = Text::new("Header (format: Key: Value, or press Enter to finish):")
                    .prompt()?;
                if header.is_empty() {
                    break;
                }
                let parts: Vec<_> = header.splitn(2, ':').collect();
                if parts.len() == 2 {
                    headers_map.insert(parts[0].trim().to_string(), parts[1].trim().to_string());
                }
            }
            if headers_map.is_empty() { None } else { Some(headers_map) }
        } else {
            None
        };

        if transport_type.starts_with("streamable") {
            McpTransport::StreamableHttp { url, headers, timeout: None }
        } else {
            McpTransport::Sse { url, headers, timeout: None }
        }
    };

    let mcp = McpServer::new(name, transport);
    manager.add_mcp(mcp.clone())?;

    println!("\n{}", "✅ MCP server added successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&mcp)?);

    Ok(())
}

fn add_sub_agent(manager: &mut ConfigManager) -> Result<()> {
    println!("\n{}", "═══ Add Sub-agent ═══".bold().cyan());

    let name = Text::new("Sub-agent name:")
        .with_help_message("e.g., code-reviewer, test-writer")
        .prompt()?;

    let description = Text::new("Description (optional):")
        .prompt()?;
    let description = if description.is_empty() { None } else { Some(description) };

    let model = Text::new("Model (optional):")
        .with_help_message("e.g., claude-sonnet-4-6, gpt-4")
        .prompt()?;
    let model = if model.is_empty() { None } else { Some(model) };

    let instructions = Text::new("Instructions/system prompt (optional):")
        .with_help_message("Describe the sub-agent's role and behavior")
        .prompt()?;
    let instructions = if instructions.is_empty() { None } else { Some(instructions) };

    let agent = SubAgent {
        name,
        enabled: true,
        description,
        model,
        instructions,
    };

    manager.add_sub_agent(agent.clone())?;

    println!("\n{}", "✅ Sub-agent added successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&agent)?);

    Ok(())
}

fn select_existing_resource(
    manager: &ConfigManager,
    resource_type: ResourceType,
    action: &str
) -> Result<Option<String>> {
    let config = match manager.config() {
        Some(c) => c,
        None => {
            println!("{}", "No configuration loaded.".yellow());
            return Ok(None);
        }
    };

    let items: Vec<String> = match resource_type {
        ResourceType::Skills => config.skills.iter().map(|s| s.name.clone()).collect(),
        ResourceType::Mcps => config.mcps.iter().map(|m| m.name.clone()).collect(),
        ResourceType::SubAgents => config.sub_agents.iter().map(|a| a.name.clone()).collect(),
    };

    if items.is_empty() {
        println!("{}", format!("No {:?} configured yet.", resource_type).yellow());
        return Ok(None);
    }

    let selected = Select::new(
        &format!("Select resource to {}", action),
        items
    ).prompt()?;

    Ok(Some(selected))
}

fn update_resource(manager: &mut ConfigManager) -> Result<()> {
    let resource_type = select_resource_type()?;

    let name = match select_existing_resource(manager, resource_type, "update")? {
        Some(n) => n,
        None => return Ok(()),
    };

    match resource_type {
        ResourceType::Skills => update_skill(manager, &name)?,
        ResourceType::Mcps => update_mcp(manager, &name)?,
        ResourceType::SubAgents => update_sub_agent(manager, &name)?,
    }

    Ok(())
}

fn update_skill(manager: &mut ConfigManager, name: &str) -> Result<()> {
    println!("\n{}", format!("═══ Update Skill: {} ═══", name).bold().cyan());

    let existing = manager
        .get_skill(name)
        .ok_or_else(|| anyhow::anyhow!("Skill not found"))?
        .clone();

    let mut skill = existing.clone();

    // Select fields to update
    let options = vec![
        "Description",
        "Author",
        "Version",
        "Tools",
    ];

    let selected = MultiSelect::new("Select fields to update:", options).prompt()?;

    for field in selected {
        match field {
            "Description" => {
                let current = skill.description.as_deref().unwrap_or("");
                let value = Text::new("Description:")
                    .with_default(current)
                    .prompt()?;
                skill.description = if value.is_empty() { None } else { Some(value) };
            }
            "Author" => {
                let current = skill.author.as_deref().unwrap_or("");
                let value = Text::new("Author:")
                    .with_default(current)
                    .prompt()?;
                skill.author = if value.is_empty() { None } else { Some(value) };
            }
            "Version" => {
                let current = skill.version.as_deref().unwrap_or("");
                let value = Text::new("Version:")
                    .with_default(current)
                    .prompt()?;
                skill.version = if value.is_empty() { None } else { Some(value) };
            }
            "Tools" => {
                let current = skill.tools.join(", ");
                let value = Text::new("Tools (comma-separated):")
                    .with_default(&current)
                    .prompt()?;
                skill.tools = value
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
            }
            _ => {}
        }
    }

    manager.update_skill(name, skill.clone())?;
    println!("\n{}", "✅ Skill updated successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&skill)?);

    Ok(())
}

fn update_mcp(manager: &mut ConfigManager, name: &str) -> Result<()> {
    println!("\n{}", format!("═══ Update MCP: {} ═══", name).bold().cyan());

    let existing = manager
        .get_mcp(name)
        .ok_or_else(|| anyhow::anyhow!("MCP not found"))?
        .clone();

    println!("Current transport: {}", format!("{:?}", existing.transport).dimmed());

    let update_transport = Confirm::new("Update transport configuration?")
        .with_default(false)
        .prompt()?;

    let mut mcp = existing.clone();

    if update_transport {
        // Re-use add_mcp logic for transport
        let transport_type = Select::new(
            "New transport type:",
            vec!["stdio (command)", "streamable-http (URL)", "sse (URL, legacy)"]
        ).prompt()?;

        mcp.transport = if transport_type.starts_with("stdio") {
            let command = Text::new("Command:")
                .prompt()?;
            let parts: Vec<String> = command.split_whitespace().map(String::from).collect();
            if parts.is_empty() {
                bail!("Command cannot be empty");
            }
            let cmd = parts[0].clone();
            let args = parts.into_iter().skip(1).collect();
            McpTransport::Stdio { command: cmd, args, env: None, timeout: None }
        } else {
            let url = Text::new("URL:").prompt()?;
            if transport_type.starts_with("streamable") {
                McpTransport::StreamableHttp { url, headers: None, timeout: None }
            } else {
                McpTransport::Sse { url, headers: None, timeout: None }
            }
        };
    }

    manager.update_mcp(name, mcp.clone())?;
    println!("\n{}", "✅ MCP server updated successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&mcp)?);

    Ok(())
}

fn update_sub_agent(manager: &mut ConfigManager, name: &str) -> Result<()> {
    println!("\n{}", format!("═══ Update Sub-agent: {} ═══", name).bold().cyan());

    let existing = manager
        .get_sub_agent(name)
        .ok_or_else(|| anyhow::anyhow!("Sub-agent not found"))?
        .clone();

    let mut agent = existing.clone();

    let options = vec!["Description", "Model", "Instructions"];
    let selected = MultiSelect::new("Select fields to update:", options).prompt()?;

    for field in selected {
        match field {
            "Description" => {
                let current = agent.description.as_deref().unwrap_or("");
                let value = Text::new("Description:").with_default(current).prompt()?;
                agent.description = if value.is_empty() { None } else { Some(value) };
            }
            "Model" => {
                let current = agent.model.as_deref().unwrap_or("");
                let value = Text::new("Model:").with_default(current).prompt()?;
                agent.model = if value.is_empty() { None } else { Some(value) };
            }
            "Instructions" => {
                let current = agent.instructions.as_deref().unwrap_or("");
                let value = Text::new("Instructions:").with_default(current).prompt()?;
                agent.instructions = if value.is_empty() { None } else { Some(value) };
            }
            _ => {}
        }
    }

    manager.update_sub_agent(name, agent.clone())?;
    println!("\n{}", "✅ Sub-agent updated successfully!".green().bold());
    println!("{}", serde_json::to_string_pretty(&agent)?);

    Ok(())
}

fn delete_resource(manager: &mut ConfigManager) -> Result<()> {
    let resource_type = select_resource_type()?;

    let name = match select_existing_resource(manager, resource_type, "delete")? {
        Some(n) => n,
        None => return Ok(()),
    };

    let confirm = Confirm::new(&format!("Are you sure you want to delete '{}' permanently?", name))
        .with_default(false)
        .prompt()?;

    if !confirm {
        println!("{}", "Cancelled.".dimmed());
        return Ok(());
    }

    match resource_type {
        ResourceType::Skills => manager.remove_skill(&name)?,
        ResourceType::Mcps => manager.remove_mcp(&name)?,
        ResourceType::SubAgents => manager.remove_sub_agent(&name)?,
    }

    println!("{} '{}' has been deleted.", "✅".green(), name);

    Ok(())
}

fn toggle_resource(manager: &mut ConfigManager) -> Result<()> {
    let resource_type = select_resource_type()?;

    let name = match select_existing_resource(manager, resource_type, "toggle")? {
        Some(n) => n,
        None => return Ok(()),
    };

    // Check current state
    let (is_enabled, can_toggle) = match resource_type {
        ResourceType::Skills => {
            let skill = manager.get_skill(&name).unwrap();
            (skill.enabled, true)
        }
        ResourceType::Mcps => {
            let mcp = manager.get_mcp(&name).unwrap();
            // Claude doesn't support MCP enable/disable
            let can = manager.agent_name() != "claude";
            (mcp.enabled, can)
        }
        ResourceType::SubAgents => {
            let agent = manager.get_sub_agent(&name).unwrap();
            (agent.enabled, true)
        }
    };

    if !can_toggle {
        println!("{}", "❌ Claude Code doesn't support enabling/disabling MCP servers.".red());
        return Ok(());
    }

    let action = if is_enabled { "disable" } else { "enable" };
    let confirm = Confirm::new(&format!("{} '{}'?", action, name))
        .with_default(true)
        .prompt()?;

    if !confirm {
        println!("{}", "Cancelled.".dimmed());
        return Ok(());
    }

    match resource_type {
        ResourceType::Skills => {
            if is_enabled {
                manager.disable_skill(&name)?
            } else {
                manager.enable_skill(&name)?
            }
        }
        ResourceType::Mcps => {
            if is_enabled {
                manager.disable_mcp(&name)?
            } else {
                manager.enable_mcp(&name)?
            }
        }
        ResourceType::SubAgents => {
            if is_enabled {
                manager.disable_sub_agent(&name)?
            } else {
                manager.enable_sub_agent(&name)?
            }
        }
    }

    println!("{} '{}' is now {}.",
        "✅".green(),
        name,
        if is_enabled { "disabled".red() } else { "enabled".green() }
    );

    Ok(())
}

fn describe_resource(manager: &ConfigManager) -> Result<()> {
    let resource_type = select_resource_type()?;

    let name = match select_existing_resource(manager, resource_type, "view")? {
        Some(n) => n,
        None => return Ok(()),
    };

    let config = manager.config().unwrap();

    match resource_type {
        ResourceType::Skills => {
            let skill = config.skills.iter().find(|s| s.name == name).unwrap();
            println!("\n{}", format!("═══ Skill: {} ═══", name).bold().cyan());
            println!("{}", serde_json::to_string_pretty(skill)?);
        }
        ResourceType::Mcps => {
            let mcp = config.mcps.iter().find(|m| m.name == name).unwrap();
            println!("\n{}", format!("═══ MCP Server: {} ═══", name).bold().cyan());
            println!("{}", serde_json::to_string_pretty(mcp)?);
        }
        ResourceType::SubAgents => {
            let agent = config.sub_agents.iter().find(|a| a.name == name).unwrap();
            println!("\n{}", format!("═══ Sub-agent: {} ═══", name).bold().cyan());
            println!("{}", serde_json::to_string_pretty(agent)?);
        }
    }

    Ok(())
}
