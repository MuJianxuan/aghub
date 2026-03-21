use aghub_core::models::AgentType;
use rocket::http::Status;
use rocket::request::FromParam;
use std::path::PathBuf;

use crate::error::ApiError;

pub struct AgentParam(pub AgentType);

impl<'r> FromParam<'r> for AgentParam {
    type Error = String;

    fn from_param(param: &'r str) -> Result<Self, Self::Error> {
        param.parse::<AgentType>().map(AgentParam)
    }
}

#[derive(rocket::FromForm)]
pub struct ScopeParams {
    pub scope: Option<String>,
    pub project_root: Option<String>,
}

impl ScopeParams {
    pub fn resolve(&self) -> Result<(bool, Option<PathBuf>), ApiError> {
        let scope = self.scope.as_deref().unwrap_or("global");
        match scope {
            "global" => Ok((true, None)),
            "project" => {
                let root = self.project_root.as_deref().ok_or_else(|| {
                    ApiError::new(
                        Status::BadRequest,
                        "project_root is required when scope=project",
                        "MISSING_PARAM",
                    )
                })?;
                Ok((false, Some(PathBuf::from(root))))
            }
            other => Err(ApiError::new(
                Status::BadRequest,
                format!("Unknown scope '{}'. Use 'global' or 'project'", other),
                "INVALID_PARAM",
            )),
        }
    }
}
