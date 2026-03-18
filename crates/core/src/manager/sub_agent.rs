use super::ConfigManager;
use crate::{
	errors::{ConfigError, Result},
	models::SubAgent,
};

impl ConfigManager {
	pub fn add_sub_agent(&mut self, agent: SubAgent) -> Result<()> {
		let config = self.config_mut()?;
		if config.sub_agents.iter().any(|a| a.name == agent.name) {
			return Err(ConfigError::resource_exists("sub-agent", &agent.name));
		}
		config.sub_agents.push(agent);
		self.save_current()
	}

	pub fn get_sub_agent(&self, name: &str) -> Option<&SubAgent> {
		self.config
			.as_ref()?
			.sub_agents
			.iter()
			.find(|a| a.name == name)
	}

	pub fn update_sub_agent(
		&mut self,
		name: &str,
		agent: SubAgent,
	) -> Result<()> {
		let config = self.config_mut()?;
		let index = config
			.sub_agents
			.iter()
			.position(|a| a.name == name)
			.ok_or_else(|| {
				ConfigError::resource_not_found("sub-agent", name)
			})?;
		config.sub_agents[index] = agent;
		self.save_current()
	}

	pub fn remove_sub_agent(&mut self, name: &str) -> Result<()> {
		let config = self.config_mut()?;
		let index = config
			.sub_agents
			.iter()
			.position(|a| a.name == name)
			.ok_or_else(|| {
				ConfigError::resource_not_found("sub-agent", name)
			})?;
		config.sub_agents.remove(index);
		self.save_current()
	}

	pub fn disable_sub_agent(&mut self, name: &str) -> Result<()> {
		let config = self.config_mut()?;
		let agent = config
			.sub_agents
			.iter_mut()
			.find(|a| a.name == name)
			.ok_or_else(|| {
				ConfigError::resource_not_found("sub-agent", name)
			})?;
		agent.enabled = false;
		self.save_current()
	}

	pub fn enable_sub_agent(&mut self, name: &str) -> Result<()> {
		let config = self.config_mut()?;
		let agent = config
			.sub_agents
			.iter_mut()
			.find(|a| a.name == name)
			.ok_or_else(|| {
				ConfigError::resource_not_found("sub-agent", name)
			})?;
		agent.enabled = true;
		self.save_current()
	}
}
