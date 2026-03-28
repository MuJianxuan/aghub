use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CodeEditorType {
	VsCode,
	AntiGravity,
	Cursor,
	Zed,
}

impl CodeEditorType {
	pub fn display_name(&self) -> &'static str {
		match self {
			CodeEditorType::VsCode => "VS Code",
			CodeEditorType::AntiGravity => "AntiGravity",
			CodeEditorType::Cursor => "Cursor",
			CodeEditorType::Zed => "Zed",
		}
	}

	pub fn cli_command(&self) -> &'static str {
		match self {
			CodeEditorType::VsCode => "code",
			CodeEditorType::AntiGravity => "antigravity",
			CodeEditorType::Cursor => "cursor",
			CodeEditorType::Zed => "zed",
		}
	}

	pub fn all() -> &'static [CodeEditorType] {
		&[
			CodeEditorType::VsCode,
			CodeEditorType::AntiGravity,
			CodeEditorType::Cursor,
			CodeEditorType::Zed,
		]
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInfoDto {
	pub id: String,
	pub name: String,
	pub installed: bool,
	pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ToolPreferencesDto {
	pub code_editor: Option<CodeEditorType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenWithEditorRequest {
	pub path: String,
	pub editor: CodeEditorType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenSkillFolderRequest {
	pub skill_path: String,
	pub editor: Option<CodeEditorType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditSkillFolderRequest {
	pub skill_path: String,
}
