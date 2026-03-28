use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CodeEditorType {
	VsCode,
	VsCodeInsiders,
	Cursor,
	Windsurf,
	Zed,
	AntiGravity,
	Trae,
	SublimeText,
	WebStorm,
	IntellijIdea,
	GoLand,
	RustRover,
	Fleet,
	Nova,
	VsCodium,
}

pub struct EditorDescriptor {
	pub display_name: &'static str,
	pub cli_command: &'static str,
	pub macos_app_name: &'static str,
}

impl CodeEditorType {
	pub fn descriptor(&self) -> EditorDescriptor {
		match self {
			Self::VsCode => EditorDescriptor {
				display_name: "VS Code",
				cli_command: "code",
				macos_app_name: "Visual Studio Code.app",
			},
			Self::VsCodeInsiders => EditorDescriptor {
				display_name: "VS Code Insiders",
				cli_command: "code-insiders",
				macos_app_name: "Visual Studio Code - Insiders.app",
			},
			Self::Cursor => EditorDescriptor {
				display_name: "Cursor",
				cli_command: "cursor",
				macos_app_name: "Cursor.app",
			},
			Self::Windsurf => EditorDescriptor {
				display_name: "Windsurf",
				cli_command: "windsurf",
				macos_app_name: "Windsurf.app",
			},
			Self::Zed => EditorDescriptor {
				display_name: "Zed",
				cli_command: "zed",
				macos_app_name: "Zed.app",
			},
			Self::AntiGravity => EditorDescriptor {
				display_name: "AntiGravity",
				cli_command: "antigravity",
				macos_app_name: "Antigravity.app",
			},
			Self::Trae => EditorDescriptor {
				display_name: "Trae",
				cli_command: "trae",
				macos_app_name: "Trae.app",
			},
			Self::SublimeText => EditorDescriptor {
				display_name: "Sublime Text",
				cli_command: "subl",
				macos_app_name: "Sublime Text.app",
			},
			Self::WebStorm => EditorDescriptor {
				display_name: "WebStorm",
				cli_command: "webstorm",
				macos_app_name: "WebStorm.app",
			},
			Self::IntellijIdea => EditorDescriptor {
				display_name: "IntelliJ IDEA",
				cli_command: "idea",
				macos_app_name: "IntelliJ IDEA.app",
			},
			Self::GoLand => EditorDescriptor {
				display_name: "GoLand",
				cli_command: "goland",
				macos_app_name: "GoLand.app",
			},
			Self::RustRover => EditorDescriptor {
				display_name: "RustRover",
				cli_command: "rustrover",
				macos_app_name: "RustRover.app",
			},
			Self::Fleet => EditorDescriptor {
				display_name: "Fleet",
				cli_command: "fleet",
				macos_app_name: "Fleet.app",
			},
			Self::Nova => EditorDescriptor {
				display_name: "Nova",
				cli_command: "nova",
				macos_app_name: "Nova.app",
			},
			Self::VsCodium => EditorDescriptor {
				display_name: "VSCodium",
				cli_command: "codium",
				macos_app_name: "VSCodium.app",
			},
		}
	}

	pub fn display_name(&self) -> &'static str {
		self.descriptor().display_name
	}

	pub fn cli_command(&self) -> &'static str {
		self.descriptor().cli_command
	}

	pub fn macos_app_name(&self) -> &'static str {
		self.descriptor().macos_app_name
	}

	pub fn all() -> &'static [CodeEditorType] {
		&[
			Self::VsCode,
			Self::VsCodeInsiders,
			Self::Cursor,
			Self::Windsurf,
			Self::Zed,
			Self::AntiGravity,
			Self::Trae,
			Self::SublimeText,
			Self::WebStorm,
			Self::IntellijIdea,
			Self::GoLand,
			Self::RustRover,
			Self::Fleet,
			Self::Nova,
			Self::VsCodium,
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
