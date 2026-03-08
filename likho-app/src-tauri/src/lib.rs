// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:likho.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "Create offline folders and notes tables",
                        sql: "CREATE TABLE IF NOT EXISTS folders (
                            id TEXT PRIMARY KEY,
                            name TEXT NOT NULL,
                            parent_id TEXT,
                            icon TEXT,
                            sort_order INTEGER DEFAULT 0,
                            is_expanded INTEGER DEFAULT 0,
                            created_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL
                        );
                        CREATE TABLE IF NOT EXISTS notes (
                            id TEXT PRIMARY KEY,
                            title TEXT NOT NULL DEFAULT 'Untitled',
                            content TEXT,
                            folder_id TEXT,
                            icon TEXT,
                            cover_image TEXT,
                            sort_order INTEGER DEFAULT 0,
                            created_at TEXT NOT NULL,
                            updated_at TEXT NOT NULL,
                            FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
                        );",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
