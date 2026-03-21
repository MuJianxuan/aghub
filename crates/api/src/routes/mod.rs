pub mod agents;
pub mod catchers;
pub mod mcps;
pub mod skills;

use aghub_core::{create_adapter, manager::ConfigManager};

use crate::error::ApiError;
use crate::extractors::{AgentParam, ScopeParams};

pub fn build_manager(agent: &AgentParam, scope: &ScopeParams) -> Result<ConfigManager, ApiError> {
    let (global, project_root) = scope.resolve()?;
    let adapter = create_adapter(agent.0);
    Ok(ConfigManager::new(adapter, global, project_root.as_deref()))
}
