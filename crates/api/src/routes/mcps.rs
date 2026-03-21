use aghub_core::{errors::ConfigError, models::McpServer};
use rocket::http::Status;
use rocket::response::status::NoContent;
use rocket::serde::json::Json;

use crate::{
    dto::mcp::{CreateMcpRequest, McpResponse, UpdateMcpRequest},
    error::{ApiCreated, ApiError, ApiNoContent, ApiResult},
    extractors::{AgentParam, ScopeParams},
    routes::build_manager,
};

#[get("/agents/<agent>/mcps?<scope..>")]
pub fn list_mcps(agent: AgentParam, scope: ScopeParams) -> ApiResult<Vec<McpResponse>> {
    let mut manager = build_manager(&agent, &scope)?;
    let config = manager.load().map_err(ApiError::from)?;
    let mcps = config.mcps.iter().map(McpResponse::from).collect();
    Ok(Json(mcps))
}

#[post("/agents/<agent>/mcps?<scope..>", data = "<body>")]
pub fn create_mcp(
    agent: AgentParam,
    scope: ScopeParams,
    body: Json<CreateMcpRequest>,
) -> ApiCreated<McpResponse> {
    let mut manager = build_manager(&agent, &scope)?;
    match manager.load() {
        Ok(_) => {}
        Err(ConfigError::NotFound { .. }) => manager.init_empty_config(),
        Err(e) => return Err(ApiError::from(e)),
    }
    let mcp = McpServer::from(body.into_inner());
    let response = McpResponse::from(&mcp);
    manager.add_mcp(mcp).map_err(ApiError::from)?;
    Ok((Status::Created, Json(response)))
}

#[get("/agents/<agent>/mcps/<name>?<scope..>")]
pub fn get_mcp(agent: AgentParam, name: &str, scope: ScopeParams) -> ApiResult<McpResponse> {
    let mut manager = build_manager(&agent, &scope)?;
    manager.load().map_err(ApiError::from)?;
    let mcp = manager
        .get_mcp(name)
        .ok_or_else(|| ApiError::from(ConfigError::resource_not_found("mcp", name)))?;
    Ok(Json(McpResponse::from(mcp)))
}

#[put("/agents/<agent>/mcps/<name>?<scope..>", data = "<body>")]
pub fn update_mcp(
    agent: AgentParam,
    name: &str,
    scope: ScopeParams,
    body: Json<UpdateMcpRequest>,
) -> ApiResult<McpResponse> {
    let mut manager = build_manager(&agent, &scope)?;
    manager.load().map_err(ApiError::from)?;
    let existing = manager
        .get_mcp(name)
        .ok_or_else(|| ApiError::from(ConfigError::resource_not_found("mcp", name)))?
        .clone();
    let updated = body.into_inner().apply_to(existing);
    let response = McpResponse::from(&updated);
    manager.update_mcp(name, updated).map_err(ApiError::from)?;
    Ok(Json(response))
}

#[delete("/agents/<agent>/mcps/<name>?<scope..>")]
pub fn delete_mcp(agent: AgentParam, name: &str, scope: ScopeParams) -> ApiNoContent {
    let mut manager = build_manager(&agent, &scope)?;
    manager.load().map_err(ApiError::from)?;
    manager.remove_mcp(name).map_err(ApiError::from)?;
    Ok(NoContent)
}

#[post("/agents/<agent>/mcps/<name>/enable?<scope..>")]
pub fn enable_mcp(agent: AgentParam, name: &str, scope: ScopeParams) -> ApiResult<McpResponse> {
    let mut manager = build_manager(&agent, &scope)?;
    manager.load().map_err(ApiError::from)?;
    manager.enable_mcp(name).map_err(ApiError::from)?;
    let mcp = manager.get_mcp(name).expect("mcp present after enable");
    Ok(Json(McpResponse::from(mcp)))
}

#[post("/agents/<agent>/mcps/<name>/disable?<scope..>")]
pub fn disable_mcp(agent: AgentParam, name: &str, scope: ScopeParams) -> ApiResult<McpResponse> {
    let mut manager = build_manager(&agent, &scope)?;
    manager.load().map_err(ApiError::from)?;
    manager.disable_mcp(name).map_err(ApiError::from)?;
    let mcp = manager.get_mcp(name).expect("mcp present after disable");
    Ok(Json(McpResponse::from(mcp)))
}
