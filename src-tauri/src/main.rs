#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem,
};
use tauri_plugin_autostart::MacosLauncher;
use std::process::Command;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;

mod hardware;
mod database;

use hardware::{HardwareManager, ServiceConfig};
use database::{Database, Service};

struct AppState {
    hardware: Arc<HardwareManager>,
    database: Arc<Database>,
}

// Command to handle system power management
#[tauri::command]
async fn handle_power_action(action: &str) -> Result<(), String> {
    match action {
        "shutdown" => {
            #[cfg(target_os = "linux")]
            Command::new("shutdown")
                .arg("-h")
                .arg("now")
                .output()
                .map_err(|e| e.to_string())?;
        }
        "restart" => {
            #[cfg(target_os = "linux")]
            Command::new("shutdown")
                .arg("-r")
                .arg("now")
                .output()
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Invalid power action".to_string()),
    }
    Ok(())
}

// Command to handle display power management
#[tauri::command]
async fn handle_display_power(action: &str) -> Result<(), String> {
    match action {
        "on" => {
            #[cfg(target_os = "linux")]
            Command::new("xset")
                .arg("dpms")
                .arg("force")
                .arg("on")
                .output()
                .map_err(|e| e.to_string())?;
        }
        "off" => {
            #[cfg(target_os = "linux")]
            Command::new("xset")
                .arg("dpms")
                .arg("force")
                .arg("off")
                .output()
                .map_err(|e| e.to_string())?;
        }
        _ => return Err("Invalid display action".to_string()),
    }
    Ok(())
}

// Command to handle system tray visibility
#[tauri::command]
async fn toggle_system_tray(window: tauri::Window) -> Result<(), String> {
    if window.is_visible().unwrap_or(false) {
        window.hide().map_err(|e| e.to_string())?;
    } else {
        window.show().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn get_services(state: State<'_, AppState>) -> Result<Vec<Service>, String> {
    state.database.get_services().map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_service(
    state: State<'_, AppState>,
    service: Service,
) -> Result<(), String> {
    state.database.add_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_service(
    state: State<'_, AppState>,
    service: Service,
) -> Result<(), String> {
    state.database.update_service(&service).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_service(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), String> {
    state.database.delete_service(&id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn backup_database(
    state: State<'_, AppState>,
    backup_path: PathBuf,
) -> Result<(), String> {
    state.database.backup(&backup_path).map_err(|e| e.to_string())
}

fn main() {
    let hardware = Arc::new(HardwareManager::new());
    let database = Arc::new(Database::new(PathBuf::from("kiosk.db").as_ref())
        .expect("Failed to initialize database"));

    let state = AppState {
        hardware,
        database,
    };

    // Create system tray menu
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
        .add_item(hide)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"])))
        .system_tray(system_tray)
        .manage(state)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "hide" => {
                        let window = app.get_window("main").unwrap();
                        if window.is_visible().unwrap() {
                            window.hide().unwrap();
                        } else {
                            window.show().unwrap();
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            handle_power_action,
            handle_display_power,
            toggle_system_tray,
            get_services,
            add_service,
            update_service,
            delete_service,
            backup_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 