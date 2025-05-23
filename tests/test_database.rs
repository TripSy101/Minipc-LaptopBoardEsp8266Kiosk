use kiosk::database::{Database, Service};
use std::path::PathBuf;
use tempfile::NamedTempFile;

#[test]
fn test_database_operations() {
    let temp_file = NamedTempFile::new().unwrap();
    let db = Database::new(temp_file.path()).unwrap();

    // Test adding a service
    let service = Service {
        id: "test1".to_string(),
        name: "Test Service".to_string(),
        price: 10.0,
        duration: 30,
        is_active: true,
    };

    db.add_service(&service).unwrap();

    // Test getting services
    let services = db.get_services().unwrap();
    assert_eq!(services.len(), 1);
    assert_eq!(services[0].id, "test1");
    assert_eq!(services[0].name, "Test Service");

    // Test updating a service
    let updated_service = Service {
        id: "test1".to_string(),
        name: "Updated Service".to_string(),
        price: 15.0,
        duration: 45,
        is_active: true,
    };

    db.update_service(&updated_service).unwrap();

    // Verify update
    let services = db.get_services().unwrap();
    assert_eq!(services[0].name, "Updated Service");
    assert_eq!(services[0].price, 15.0);

    // Test deleting a service
    db.delete_service("test1").unwrap();

    // Verify deletion
    let services = db.get_services().unwrap();
    assert_eq!(services.len(), 0);
}

#[test]
fn test_database_backup() {
    let temp_file = NamedTempFile::new().unwrap();
    let db = Database::new(temp_file.path()).unwrap();

    // Add some test data
    let service = Service {
        id: "test1".to_string(),
        name: "Test Service".to_string(),
        price: 10.0,
        duration: 30,
        is_active: true,
    };

    db.add_service(&service).unwrap();

    // Create backup
    let backup_file = NamedTempFile::new().unwrap();
    db.backup(backup_file.path()).unwrap();

    // Verify backup
    let backup_db = Database::new(backup_file.path()).unwrap();
    let services = backup_db.get_services().unwrap();
    assert_eq!(services.len(), 1);
    assert_eq!(services[0].id, "test1");
} 