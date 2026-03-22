use aghub_api::{ApiOptions, start};

#[tokio::main]
async fn main() {
    start(ApiOptions { port: 8000 }).await.expect("server error");
}
