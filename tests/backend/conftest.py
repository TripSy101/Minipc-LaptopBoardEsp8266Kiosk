import pytest
from backend.app_server import create_app
from backend.serial_manager import SerialManager
from backend.usb_manager import USBManager

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
    })
    return app

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def serial_manager():
    return SerialManager()

@pytest.fixture
def usb_manager():
    return USBManager()

@pytest.fixture
def mock_serial_port(mocker):
    mock_port = mocker.MagicMock()
    mock_port.is_open = True
    mock_port.write = mocker.MagicMock()
    mock_port.read = mocker.MagicMock(return_value=b'OK')
    return mock_port

@pytest.fixture
def mock_usb_device(mocker):
    mock_device = mocker.MagicMock()
    mock_device.idVendor = 0x1234
    mock_device.idProduct = 0x5678
    mock_device.manufacturer = "Test Manufacturer"
    mock_device.product = "Test Product"
    return mock_device 