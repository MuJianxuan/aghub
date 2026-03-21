use aghub_core::models::Skill;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct CreateSkillRequest {
    pub name: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub tools: Option<Vec<String>>,
}

impl From<CreateSkillRequest> for Skill {
    fn from(req: CreateSkillRequest) -> Self {
        Skill {
            name: req.name,
            enabled: true,
            description: req.description,
            author: req.author,
            version: req.version,
            tools: req.tools.unwrap_or_default(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSkillRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub tools: Option<Vec<String>>,
    pub enabled: Option<bool>,
}

impl UpdateSkillRequest {
    pub fn apply_to(self, existing: Skill) -> Skill {
        Skill {
            name: self.name.unwrap_or(existing.name),
            enabled: self.enabled.unwrap_or(existing.enabled),
            description: self.description.or(existing.description),
            author: self.author.or(existing.author),
            version: self.version.or(existing.version),
            tools: self.tools.unwrap_or(existing.tools),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct SkillResponse {
    pub name: String,
    pub enabled: bool,
    pub description: Option<String>,
    pub author: Option<String>,
    pub version: Option<String>,
    pub tools: Vec<String>,
}

impl From<Skill> for SkillResponse {
    fn from(s: Skill) -> Self {
        SkillResponse {
            name: s.name,
            enabled: s.enabled,
            description: s.description,
            author: s.author,
            version: s.version,
            tools: s.tools,
        }
    }
}

impl From<&Skill> for SkillResponse {
    fn from(s: &Skill) -> Self {
        SkillResponse {
            name: s.name.clone(),
            enabled: s.enabled,
            description: s.description.clone(),
            author: s.author.clone(),
            version: s.version.clone(),
            tools: s.tools.clone(),
        }
    }
}
