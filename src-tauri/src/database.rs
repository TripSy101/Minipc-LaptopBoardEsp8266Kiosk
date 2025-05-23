use rusqlite::{Connection, Result, Transaction};
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize)]
pub struct Service {
    pub id: String,
    pub name: String,
    pub price: f64,
    pub duration: i32,
    pub is_active: bool,
}

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: &Path) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init()?;
        Ok(db)
    }

    fn init(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS services (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price REAL NOT NULL,
                duration INTEGER NOT NULL,
                is_active BOOLEAN NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    pub fn add_service(&self, service: &Service) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        
        tx.execute(
            "INSERT INTO services (id, name, price, duration, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            (
                &service.id,
                &service.name,
                service.price,
                service.duration,
                service.is_active,
            ),
        )?;
        
        tx.commit()?;
        Ok(())
    }

    pub fn get_services(&self) -> Result<Vec<Service>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, price, duration, is_active FROM services"
        )?;
        
        let services = stmt.query_map([], |row| {
            Ok(Service {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                duration: row.get(3)?,
                is_active: row.get(4)?,
            })
        })?;
        
        services.collect()
    }

    pub fn update_service(&self, service: &Service) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        
        tx.execute(
            "UPDATE services 
             SET name = ?2, price = ?3, duration = ?4, is_active = ?5
             WHERE id = ?1",
            (
                &service.id,
                &service.name,
                service.price,
                service.duration,
                service.is_active,
            ),
        )?;
        
        tx.commit()?;
        Ok(())
    }

    pub fn delete_service(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let tx = conn.transaction()?;
        
        tx.execute("DELETE FROM services WHERE id = ?1", [id])?;
        
        tx.commit()?;
        Ok(())
    }

    pub fn backup(&self, backup_path: &Path) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let backup_conn = Connection::open(backup_path)?;
        
        conn.backup(rusqlite::DatabaseName::Main, &backup_conn, rusqlite::DatabaseName::Main)?;
        
        Ok(())
    }
} 