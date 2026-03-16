use crate::ResourceType;
use aghub_core::manager::ConfigManager;
use anyhow::Result;
use serde_json::json;

pub fn execute(manager: &mut ConfigManager, resource: ResourceType, name: String) -> Result<()> {
    match resource {
        ResourceType::Skills => {
            manager.remove_skill(&name)?;
            println!("{}", json!({"deleted": true, "name": name, "type": "skill" }));
        }
        ResourceType::Mcps => {
            manager.remove_mcp(&name)?;
            println!("{}", json!({"deleted": true, "name": name, "type": "mcp" }));
        }
        ResourceType::SubAgents => {
            manager.remove_sub_agent(&name)?;
            println!("{}", json!({"deleted": true, "name": name, "type": "sub-agent" }));
        }
    }

    Ok(())
}
