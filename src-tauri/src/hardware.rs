use serde::{Deserialize, Serialize};
use std::error::Error;
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServiceConfig {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub duration: i32,
    pub is_active: bool,
}

#[derive(Debug)]
pub struct HardwareManager {
    services: Arc<Mutex<Vec<ServiceConfig>>>,
}

impl HardwareManager {
    pub fn new() -> Self {
        Self {
            services: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub fn add_service(&self, service: ServiceConfig) -> Result<(), Box<dyn Error>> {
        let mut services = self.services.lock().map_err(|_| "Failed to lock services")?;
        services.push(service);
        Ok(())
    }

    pub fn get_services(&self) -> Result<Vec<ServiceConfig>, Box<dyn Error>> {
        let services = self.services.lock().map_err(|_| "Failed to lock services")?;
        Ok(services.clone())
    }

    pub fn update_service(&self, id: &str, service: ServiceConfig) -> Result<(), Box<dyn Error>> {
        let mut services = self.services.lock().map_err(|_| "Failed to lock services")?;
        if let Some(index) = services.iter().position(|s| s.id == id) {
            services[index] = service;
            Ok(())
        } else {
            Err("Service not found".into())
        }
    }

    pub fn delete_service(&self, id: &str) -> Result<(), Box<dyn Error>> {
        let mut services = self.services.lock().map_err(|_| "Failed to lock services")?;
        services.retain(|s| s.id != id);
        Ok(())
    }
} 