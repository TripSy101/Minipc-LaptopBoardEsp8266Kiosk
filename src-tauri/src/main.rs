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

fn main() {
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
            toggle_system_tray
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
} 