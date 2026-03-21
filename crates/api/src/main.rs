#[macro_use]
extern crate rocket;

mod dto;
mod error;
mod extractors;
mod routes;
mod state;

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount(
            "/api/v1",
            routes![
                routes::agents::list_agents,
                routes::skills::list_skills,
                routes::skills::create_skill,
                routes::skills::get_skill,
                routes::skills::update_skill,
                routes::skills::delete_skill,
                routes::skills::enable_skill,
                routes::skills::disable_skill,
                routes::mcps::list_mcps,
                routes::mcps::create_mcp,
                routes::mcps::get_mcp,
                routes::mcps::update_mcp,
                routes::mcps::delete_mcp,
                routes::mcps::enable_mcp,
                routes::mcps::disable_mcp,
            ],
        )
        .register(
            "/",
            catchers![
                routes::catchers::not_found,
                routes::catchers::unprocessable_entity,
                routes::catchers::internal_error,
                routes::catchers::default_catcher,
            ],
        )
}
