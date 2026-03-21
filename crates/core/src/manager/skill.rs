use super::ConfigManager;
use crate::{
	convert_skill,
	errors::{ConfigError, Result},
	models::Skill,
};
use std::path::Path;

impl ConfigManager {
	pub fn add_skill(&mut self, skill: Skill) -> Result<()> {
		let config = self.config_mut()?;
		if config.skills.iter().any(|s| s.name == skill.name) {
			return Err(ConfigError::resource_exists("skill", &skill.name));
		}
		config.skills.push(skill);
		self.save_current()
	}

	pub fn get_skill(&self, name: &str) -> Option<&Skill> {
		self.config.as_ref()?.skills.iter().find(|s| s.name == name)
	}

	pub fn update_skill(&mut self, name: &str, skill: Skill) -> Result<()> {
		let config = self.config_mut()?;
		let index = config
			.skills
			.iter()
			.position(|s| s.name == name)
			.ok_or_else(|| ConfigError::resource_not_found("skill", name))?;
		config.skills[index] = skill;
		self.save_current()
	}

	pub fn remove_skill(&mut self, name: &str) -> Result<()> {
		let config = self.config_mut()?;
		let index = config
			.skills
			.iter()
			.position(|s| s.name == name)
			.ok_or_else(|| ConfigError::resource_not_found("skill", name))?;
		config.skills.remove(index);
		self.save_current()
	}

	fn set_skill_enabled(&mut self, name: &str, enabled: bool) -> Result<()> {
		let config = self.config_mut()?;
		let skill = config
			.skills
			.iter_mut()
			.find(|s| s.name == name)
			.ok_or_else(|| ConfigError::resource_not_found("skill", name))?;
		skill.enabled = enabled;
		self.save_current()
	}

	pub fn disable_skill(&mut self, name: &str) -> Result<()> {
		self.set_skill_enabled(name, false)
	}

	pub fn enable_skill(&mut self, name: &str) -> Result<()> {
		self.set_skill_enabled(name, true)
	}

	pub fn add_skill_from_path(&mut self, path: &Path) -> Result<Skill> {
		let skill_pkg = skill::parser::parse(path).map_err(|e| {
			ConfigError::InvalidConfig(format!("Failed to parse skill: {}", e))
		})?;
		let skill = convert_skill(skill_pkg);
		self.add_skill(skill.clone())?;
		Ok(skill)
	}

	pub fn validate_skill_path(&self, path: &Path) -> Vec<String> {
		let mut errors = Vec::new();
		match skill::parser::parse(path) {
			Ok(_) => {}
			Err(e) => errors.push(format!("Parse error: {}", e)),
		}
		errors
	}
}
