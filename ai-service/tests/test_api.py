import io
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from app.main import app
from app.config import settings

client = TestClient(app)

def create_test_image(width=100, height=100, color="gray"):
    file_bytes = io.BytesIO()
    image = Image.new("RGB", (width, height), color=color)
    image.save(file_bytes, format="JPEG")
    file_bytes.seek(0)
    return file_bytes

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model_loaded"] is True

def test_predict_missing_api_key():
    img_bytes = create_test_image()
    response = client.post(
        "/predict",
        files={"image": ("test.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 401
    assert "Invalid or missing" in response.json()["detail"]

def test_predict_invalid_api_key():
    img_bytes = create_test_image()
    response = client.post(
        "/predict",
        headers={"X-API-Key": "wrong-secret-key"},
        files={"image": ("test.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 401

def test_predict_valid_image():
    img_bytes = create_test_image(width=200, height=200, color="darkgray")
    response = client.post(
        "/predict",
        headers={"X-API-Key": settings.ai_service_api_key},
        files={"image": ("road.jpg", img_bytes, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "confidence" in data
    assert "severity" in data
    assert "detections" in data

def test_predict_non_image_file():
    text_file = io.BytesIO(b"This is a text file, not an image.")
    response = client.post(
        "/predict",
        headers={"X-API-Key": settings.ai_service_api_key},
        files={"image": ("document.txt", text_file, "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]
