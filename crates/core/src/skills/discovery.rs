use crate::models::Skill;
use std::fs;
use std::path::Path;

pub(crate) struct SkillMetadata {
	name: String,
	description: Option<String>,
	author: Option<String>,
	version: Option<String>,
}

pub(crate) fn parse_skill_md(content: &str) -> Option<SkillMetadata> {
	let lines: Vec<&str> = content.lines().collect();
	if lines.len() < 3 || !lines[0].trim().is_empty() && lines[0] != "---" {
		return None;
	}

	let mut name = None;
	let mut description = None;
	let mut author = None;
	let mut version = None;
	let mut in_frontmatter = false;
	let mut current_key: Option<&str> = None;

	for line in &lines {
		let trimmed = line.trim();

		if trimmed == "---" {
			if !in_frontmatter {
				in_frontmatter = true;
				continue;
			} else {
				break;
			}
		}

		if !in_frontmatter {
			continue;
		}

		if let Some(pos) = line.find(':') {
			let key = line[..pos].trim();
			let val = line[pos + 1..].trim();
			let value = if (val.starts_with('"') && val.ends_with('"'))
				|| (val.starts_with('\'') && val.ends_with('\''))
			{
				&val[1..val.len() - 1]
			} else {
				val
			};

			if key == "name" {
				name = Some(value.to_string());
				current_key = Some("name");
			} else if key == "author" {
				author = Some(value.to_string());
				current_key = Some("author");
			} else if key == "version" {
				version = Some(value.to_string());
				current_key = Some("version");
			} else if key == "description" {
				if value.is_empty() || value == ">" {
					current_key = Some("description");
					description = Some(String::new());
				} else {
					description = Some(value.to_string());
					current_key = Some("description");
				}
			} else {
				current_key = Some(key);
			}
		} else if in_frontmatter && current_key == Some("description") {
			if let Some(ref mut desc) = description {
				if !trimmed.is_empty() {
					if !desc.is_empty() {
						desc.push(' ');
					}
					desc.push_str(trimmed);
				}
			}
		}
	}

	name.map(|n| SkillMetadata {
		name: n,
		description,
		author,
		version,
	})
}

pub fn load_skills_from_dir(skills_dir: &Path) -> Vec<Skill> {
	let mut skills = Vec::new();
	collect_skills(skills_dir, &mut skills);
	skills.sort_by(|a, b| a.name.cmp(&b.name));
	skills
}

fn collect_skills(dir: &Path, skills: &mut Vec<Skill>) {
	if !dir.exists() {
		return;
	}

	let Ok(entries) = fs::read_dir(dir) else {
		return;
	};

	for entry in entries.flatten() {
		let path = entry.path();
		if !path.is_dir() {
			continue;
		}

		let skill_md_path = path.join("SKILL.md");
		if skill_md_path.exists() {
			let dir_name =
				path.file_name().and_then(|n| n.to_str()).unwrap_or("");
			if dir_name.is_empty() {
				continue;
			}
			let (display_name, description, author, version) =
				fs::read_to_string(&skill_md_path)
					.ok()
					.and_then(|content| parse_skill_md(&content))
					.map(|meta| {
						(meta.name, meta.description, meta.author, meta.version)
					})
					.unwrap_or_else(|| {
						(dir_name.to_string(), None, None, None)
					});
			skills.push(Skill {
				name: display_name,
				enabled: true,
				description,
				author,
				version,
				tools: Vec::new(),
			});
		} else {
			collect_skills(&path, skills);
		}
	}
}
