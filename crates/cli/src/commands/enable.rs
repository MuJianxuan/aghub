use crate::ResourceType;
use aghub_core::manager::ConfigManager;
use anyhow::Result;
use serde_json::json;

pub fn execute(manager: &mut ConfigManager, resource: ResourceType, name: String) -> Result<()> {
    match resource {
        ResourceType::Skills => {
            manager.enable_skill(&name)?;
            println!("{}", json!({"enabled": true, "name": name, "type": "skill" }));
        }
        ResourceType::Mcps => {
            manager.enable_mcp(&name)?;
            println!("{}", json!({"enabled": true, "name": name, "type": "mcp" }));
        }
        ResourceType::SubAgents => {
            manager.enable_sub_agent(&name)?;
            println!("{}", json!({"enabled": true, "name": name, "type": "sub-agent" }));
        }
    }

    Ok(())
}
