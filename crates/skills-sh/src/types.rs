use serde::{Deserialize, Serialize};

/// Raw response structure for a single skill
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub installs: u64,
    #[serde(default)]
    pub source: String,
}

/// API response structure
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SearchResponse {
    pub skills: Vec<Skill>,
}

/// User-friendly skill representation (mapped format)
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SearchResult {
    pub name: String,
    pub slug: String,
    pub source: String,
    pub installs: u64,
}

impl From<Skill> for SearchResult {
    fn from(skill: Skill) -> Self {
        Self {
            name: skill.name,
            slug: skill.id,
            source: skill.source,
            installs: skill.installs,
        }
    }
}

/// Search parameters
#[derive(Debug, Clone, Default)]
pub struct SearchParams {
    pub query: String,
    pub limit: Option<usize>,
}

impl SearchParams {
    pub fn new(query: impl Into<String>) -> Self {
        Self {
            query: query.into(),
            limit: None,
        }
    }

    pub fn with_limit(mut self, limit: usize) -> Self {
        self.limit = Some(limit);
        self
    }
}
