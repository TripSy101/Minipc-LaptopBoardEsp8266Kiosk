use kiosk::hardware::{HardwareManager, ServiceConfig};

#[test]
fn test_hardware_operations() {
    let hardware = HardwareManager::new();

    // Test adding a service
    let service = ServiceConfig {
        id: "test1".to_string(),
        name: "Test Service".to_string(),
        price: 10.0,
        duration: 30,
        is_active: true,
    };

    hardware.add_service(service.clone()).unwrap();

    // Test getting services
    let services = hardware.get_services().unwrap();
    assert_eq!(services.len(), 1);
    assert_eq!(services[0].id, "test1");
    assert_eq!(services[0].name, "Test Service");

    // Test updating a service
    let updated_service = ServiceConfig {
        id: "test1".to_string(),
        name: "Updated Service".to_string(),
        price: 15.0,
        duration: 45,
        is_active: true,
    };

    hardware.update_service("test1", updated_service).unwrap();

    // Verify update
    let services = hardware.get_services().unwrap();
    assert_eq!(services[0].name, "Updated Service");
    assert_eq!(services[0].price, 15.0);

    // Test deleting a service
    hardware.delete_service("test1").unwrap();

    // Verify deletion
    let services = hardware.get_services().unwrap();
    assert_eq!(services.len(), 0);
}

#[test]
fn test_concurrent_operations() {
    use std::sync::Arc;
    use std::thread;

    let hardware = Arc::new(HardwareManager::new());
    let mut handles = vec![];

    // Spawn multiple threads to test concurrent operations
    for i in 0..5 {
        let hardware_clone = Arc::clone(&hardware);
        let handle = thread::spawn(move || {
            let service = ServiceConfig {
                id: format!("test{}", i),
                name: format!("Test Service {}", i),
                price: 10.0 * (i as f64 + 1.0),
                duration: 30 * (i + 1),
                is_active: true,
            };

            hardware_clone.add_service(service).unwrap();
        });
        handles.push(handle);
    }

    // Wait for all threads to complete
    for handle in handles {
        handle.join().unwrap();
    }

    // Verify all services were added
    let services = hardware.get_services().unwrap();
    assert_eq!(services.len(), 5);

    // Verify service details
    for (i, service) in services.iter().enumerate() {
        assert_eq!(service.id, format!("test{}", i));
        assert_eq!(service.name, format!("Test Service {}", i));
        assert_eq!(service.price, 10.0 * (i as f64 + 1.0));
        assert_eq!(service.duration, 30 * (i + 1));
    }
} 