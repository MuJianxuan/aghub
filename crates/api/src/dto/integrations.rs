use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CodeEditorType {
	VsCode,
	AntiGravity,
	Cursor,
	Zed,
	Vim,
}

impl CodeEditorType {
	pub fn display_name(&self) -> &'static str {
		match self {
			CodeEditorType::VsCode => "VS Code",
			CodeEditorType::AntiGravity => "AntiGravity",
			CodeEditorType::Cursor => "Cursor",
			CodeEditorType::Zed => "Zed",
			CodeEditorType::Vim => "Vim",
		}
	}

	pub fn bundle_id(&self) -> Option<&'static str> {
		match self {
			CodeEditorType::VsCode => Some("com.microsoft.VSCode"),
			CodeEditorType::AntiGravity => Some("co.antigravity.Antigravity"),
			CodeEditorType::Cursor => Some("com.todesktop.230313mzl4w4u92"),
			CodeEditorType::Zed => Some("dev.zed.Zed"),
			CodeEditorType::Vim => None,
		}
	}

	pub fn cli_command(&self) -> &'static str {
		match self {
			CodeEditorType::VsCode => "code",
			CodeEditorType::AntiGravity => "antigravity",
			CodeEditorType::Cursor => "cursor",
			CodeEditorType::Zed => "zed",
			CodeEditorType::Vim => "vim",
		}
	}

	pub fn requires_terminal(&self) -> bool {
		matches!(self, CodeEditorType::Vim)
	}

	pub fn all() -> &'static [CodeEditorType] {
		&[
			CodeEditorType::VsCode,
			CodeEditorType::AntiGravity,
			CodeEditorType::Cursor,
			CodeEditorType::Zed,
			CodeEditorType::Vim,
		]
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerminalType {
	Alacritty,
	Ghostty,
	ITerm,
	AppleTerminal,
}

impl TerminalType {
	pub fn display_name(&self) -> &'static str {
		match self {
			TerminalType::Alacritty => "Alacritty",
			TerminalType::Ghostty => "Ghostty",
			TerminalType::ITerm => "iTerm",
			TerminalType::AppleTerminal => "Terminal",
		}
	}

	pub fn bundle_id(&self) -> &'static str {
		match self {
			TerminalType::Alacritty => "org.alacritty",
			TerminalType::Ghostty => "com.mitchellh.ghostty",
			TerminalType::ITerm => "com.googlecode.iterm2",
			TerminalType::AppleTerminal => "com.apple.Terminal",
		}
	}

	pub fn cli_command(&self) -> Option<&'static str> {
		match self {
			TerminalType::Alacritty => Some("alacritty"),
			TerminalType::Ghostty => Some("ghostty"),
			TerminalType::ITerm => Some("iterm"),
			TerminalType::AppleTerminal => Some("open"),
		}
	}

	pub fn all() -> &'static [TerminalType] {
		&[
			TerminalType::Alacritty,
			TerminalType::Ghostty,
			TerminalType::ITerm,
			TerminalType::AppleTerminal,
		]
	}
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ToolTypeDto {
	CodeEditor,
	Terminal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolInfoDto {
	pub id: String,
	pub name: String,
	pub installed: bool,
	pub path: Option<String>,
	pub tool_type: ToolTypeDto,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ToolPreferencesDto {
	pub code_editor: Option<CodeEditorType>,
	pub terminal: Option<TerminalType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenWithEditorRequest {
	pub path: String,
	pub editor: CodeEditorType,
	pub terminal: Option<TerminalType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenInTerminalRequest {
	pub path: String,
	pub terminal: TerminalType,
}
