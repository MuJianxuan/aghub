use std::path::Path;
use std::process::Command;

use rocket::serde::json::Json;
use which::which;

use crate::dto::integrations::{
	CodeEditorType, OpenWithEditorRequest, ToolInfoDto, ToolPreferencesDto,
};

fn get_code_editor_info(editor: &CodeEditorType) -> ToolInfoDto {
	let desc = editor.descriptor();

	let app_path = Path::new("/Applications").join(desc.macos_app_name);
	let from_app = app_path.exists();
	let cli_path = which(desc.cli_command)
		.ok()
		.map(|p| p.to_string_lossy().to_string());

	let installed = from_app || cli_path.is_some();
	let path = if from_app {
		Some(app_path.to_string_lossy().to_string())
	} else {
		cli_path
	};

	ToolInfoDto {
		id: serde_json::to_string(editor)
			.unwrap_or_default()
			.trim_matches('"')
			.to_string(),
		name: desc.display_name.to_string(),
		installed,
		path,
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

#[post("/integrations/open-with-editor", format = "json", data = "<request>")]
pub async fn open_with_editor(
	request: Json<OpenWithEditorRequest>,
) -> Result<(), String> {
	let req = request.into_inner();

	match Command::new(req.editor.cli_command())
		.arg(&req.path)
		.spawn()
	{
		Ok(_) => Ok(()),
		Err(e) => Err(format!("Failed to open editor: {}", e)),
	}
}

#[get("/integrations/preferences")]
pub fn get_preferences() -> Json<ToolPreferencesDto> {
	Json(ToolPreferencesDto::default())
}
