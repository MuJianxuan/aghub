use std::process::Command;

use rocket::serde::json::Json;

use crate::dto::integrations::{
	CodeEditorType, OpenInTerminalRequest, OpenWithEditorRequest, TerminalType,
	ToolInfoDto, ToolTypeDto,
};

#[cfg(target_os = "macos")]
fn is_app_installed(bundle_id: &str) -> bool {
	let output = Command::new("mdfind")
		.arg(format!("kMDItemCFBundleIdentifier == '{}'", bundle_id))
		.output();

	match output {
		Ok(result) => {
			let stdout = String::from_utf8_lossy(&result.stdout);
			!stdout.trim().is_empty()
		}
		Err(_) => false,
	}
}

fn is_command_available(command: &str) -> bool {
	Command::new("which")
		.arg(command)
		.output()
		.map(|output| output.status.success())
		.unwrap_or(false)
}

#[cfg(target_os = "macos")]
fn get_app_path(bundle_id: &str) -> Option<String> {
	let output = Command::new("mdfind")
		.arg(format!("kMDItemCFBundleIdentifier == '{}'", bundle_id))
		.output()
		.ok()?;

	let stdout = String::from_utf8_lossy(&output.stdout);
	let path = stdout.trim();
	if path.is_empty() {
		None
	} else {
		Some(path.to_string())
	}
}

fn get_code_editor_info(editor: &CodeEditorType) -> ToolInfoDto {
	let installed = match editor.bundle_id() {
		Some(bundle_id) => is_app_installed(bundle_id),
		None => is_command_available(editor.cli_command()),
	};

	let path = editor
		.bundle_id()
		.and_then(get_app_path)
		.or_else(|| {
			if is_command_available(editor.cli_command()) {
				Some(format!("$(which {})", editor.cli_command()))
			} else {
				None
			}
		});

	ToolInfoDto {
		id: serde_json::to_string(editor)
			.unwrap_or_default()
			.trim_matches('"')
			.to_string(),
		name: editor.display_name().to_string(),
		installed,
		path,
		tool_type: ToolTypeDto::CodeEditor,
	}
}

fn get_terminal_info(terminal: &TerminalType) -> ToolInfoDto {
	let installed = is_app_installed(terminal.bundle_id());

	let path = get_app_path(terminal.bundle_id()).or_else(|| {
		terminal.cli_command().and_then(|cmd| {
			if is_command_available(cmd) {
				Some(format!("$(which {})", cmd))
			} else {
				None
			}
		})
	});

	ToolInfoDto {
		id: serde_json::to_string(terminal)
			.unwrap_or_default()
			.trim_matches('"')
			.to_string(),
		name: terminal.display_name().to_string(),
		installed,
		path,
		tool_type: ToolTypeDto::Terminal,
	}
}

#[get("/integrations/code-editors")]
pub fn list_code_editors() -> Json<Vec<ToolInfoDto>> {
	let editors: Vec<ToolInfoDto> = CodeEditorType::all()
		.iter()
		.map(get_code_editor_info)
		.collect();
	Json(editors)
}

#[get("/integrations/terminals")]
pub fn list_terminals() -> Json<Vec<ToolInfoDto>> {
	let terminals: Vec<ToolInfoDto> = TerminalType::all()
		.iter()
		.map(get_terminal_info)
		.collect();
	Json(terminals)
}

#[post("/integrations/open-with-editor", format = "json", data = "<request>")]
pub async fn open_with_editor(
	request: Json<OpenWithEditorRequest>,
) -> Result<(), String> {
	let req = request.into_inner();

	if req.editor.requires_terminal() && req.terminal.is_none() {
		return Err("Selected editor requires a terminal but none was specified".to_string());
	}

	let result = if req.editor.requires_terminal() {
		open_in_terminal_with_command(
			&req.path,
			req.terminal.unwrap(),
			req.editor.cli_command(),
		)
	} else {
		Command::new(req.editor.cli_command())
			.arg(&req.path)
			.spawn()
			.map(|_| ())
	};

	match result {
		Ok(_) => Ok(()),
		Err(e) => Err(format!("Failed to open editor: {}", e)),
	}
}

#[post("/integrations/open-in-terminal", format = "json", data = "<request>")]
pub async fn open_in_terminal_endpoint(
	request: Json<OpenInTerminalRequest>,
) -> Result<(), String> {
	let req = request.into_inner();
	match open_in_terminal_with_command(&req.path, req.terminal, "") {
		Ok(_) => Ok(()),
		Err(e) => Err(format!("Failed to open terminal: {}", e)),
	}
}

#[cfg(target_os = "macos")]
fn open_in_terminal_with_command(
	path: &str,
	terminal: TerminalType,
	command: &str,
) -> Result<(), std::io::Error> {
	use std::process::Stdio;

	match terminal {
		TerminalType::AppleTerminal => {
			let script = if command.is_empty() {
				format!(r#"tell application "Terminal" to do script "cd '{}'""#, path)
			} else {
				format!(
					r#"tell application "Terminal" to do script "cd '{}' && {}""#,
					path, command
				)
			};
			Command::new("osascript")
				.arg("-e")
				.arg(&script)
				.stdout(Stdio::null())
				.stderr(Stdio::null())
				.spawn()
				.map(|_| ())
		}
		TerminalType::ITerm => {
			let script = if command.is_empty() {
				format!(
					r#"tell application "iTerm" to create window with default profile command "cd '{}'""#,
					path
				)
			} else {
				format!(
					r#"tell application "iTerm" to create window with default profile command "cd '{}' && {}""#,
					path, command
				)
			};
			Command::new("osascript")
				.arg("-e")
				.arg(&script)
				.stdout(Stdio::null())
				.stderr(Stdio::null())
				.spawn()
				.map(|_| ())
		}
		TerminalType::Alacritty => {
			let mut cmd = Command::new("alacritty");
			cmd.arg("--working-directory").arg(path);
			if !command.is_empty() {
				cmd.arg("-e")
					.arg("sh")
					.arg("-c")
					.arg(format!("{}; exec $SHELL", command));
			}
			cmd.stdout(Stdio::null())
				.stderr(Stdio::null())
				.spawn()
				.map(|_| ())
		}
		TerminalType::Ghostty => {
			let mut cmd = Command::new("ghostty");
			cmd.arg("--working-directory").arg(path);
			if !command.is_empty() {
				cmd.arg("-e").arg(format!("{}; exec $SHELL", command));
			}
			cmd.stdout(Stdio::null())
				.stderr(Stdio::null())
				.spawn()
				.map(|_| ())
		}
	}
}
