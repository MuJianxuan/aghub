use std::process::Command;

use rocket::serde::json::Json;
use which::which;

use crate::dto::integrations::{CodeEditorType, OpenWithEditorRequest, ToolInfoDto, ToolPreferencesDto};

fn get_code_editor_info(editor: &CodeEditorType) -> ToolInfoDto {
	let path = which(editor.cli_command())
		.ok()
		.map(|p| p.to_string_lossy().to_string());

	ToolInfoDto {
		id: serde_json::to_string(editor)
			.unwrap_or_default()
			.trim_matches('"')
			.to_string(),
		name: editor.display_name().to_string(),
		installed: path.is_some(),
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
