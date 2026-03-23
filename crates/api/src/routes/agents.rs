use aghub_core::registry;
use rocket::serde::json::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct CapabilitiesDto {
	pub mcp_stdio: bool,
	pub mcp_remote: bool,
	pub mcp_enable_disable: bool,
	pub skills: bool,
	pub universal_skills: bool,
}

#[derive(Debug, Serialize)]
pub struct AgentInfo {
	pub id: &'static str,
	pub display_name: &'static str,
	pub capabilities: CapabilitiesDto,
}

#[get("/agents")]
pub fn list_agents() -> Json<Vec<AgentInfo>> {
	let agents = registry::iter_all()
		.map(|d| AgentInfo {
			id: d.id,
			display_name: d.display_name,
			capabilities: CapabilitiesDto {
				mcp_stdio: d.capabilities.mcp_stdio,
				mcp_remote: d.capabilities.mcp_remote,
				mcp_enable_disable: d.capabilities.mcp_enable_disable,
				skills: d.capabilities.skills,
				universal_skills: d.capabilities.universal_skills,
			},
		})
		.collect();
	Json(agents)
}
