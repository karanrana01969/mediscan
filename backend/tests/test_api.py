import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os
from unittest.mock import patch

# Add root directory to sys path so we can import backend as a package
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.main import app
from backend.database import Base, get_db

# Use an in-memory SQLite database for testing to ensure we don't touch actual data
# and it automatically gets deleted when tests finish.
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the test database
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

class TestMediscanAPI:
    token = None
    profile_id = None
    medication_id = None
    schedule_id = None

    def test_signup(self):
        response = client.post(
            "/api/auth/signup",
            json={"email": "test@example.com", "password": "password123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_login(self):
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"}
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
        TestMediscanAPI.token = response.json()["access_token"]

    def test_create_profile(self):
        response = client.post(
            "/api/profiles/",
            json={"name": "Elderly Father", "age": 75, "relation": "Father"},
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Elderly Father"
        TestMediscanAPI.profile_id = data["id"]

    @patch('backend.routers.scan.genai.GenerativeModel.generate_content')
    def test_scan_medication_image(self, mock_generate_content):
        # Create a dummy image
        import io
        from PIL import Image
        
        # Mock the Gemini API call
        class MockResponse:
            text = '{"name": "Aspirin", "use_case": "Pain relief", "dosage": "1 pill a day", "side_effects": "Nausea", "warnings": "Do not take on empty stomach"}'
        mock_generate_content.return_value = MockResponse()
        
        img = Image.new('RGB', (100, 100), color = 'red')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG')
        img_byte_arr = img_byte_arr.getvalue()
        
        response = client.post(
            "/api/scan/image",
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"},
            files={"file": ("test.jpg", img_byte_arr, "image/jpeg")}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "use_case" in data

    @patch('backend.routers.scan.genai.GenerativeModel.generate_content')
    def test_scan_medication(self, mock_generate_content):
        # Mock the Gemini API call so we don't actually hit the paid API during tests
        class MockResponse:
            text = '{"name": "Aspirin", "use_case": "Pain relief", "dosage": "1 pill a day", "side_effects": "Nausea", "warnings": "Do not take on empty stomach"}'
        mock_generate_content.return_value = MockResponse()

        response = client.post(
            "/api/scan/",
            json={"ocr_text": "Aspirin 500mg"},
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Aspirin"
        assert data["use_case"] == "Pain relief"

    def test_add_medication(self):
        response = client.post(
            f"/api/medications/{TestMediscanAPI.profile_id}",
            json={
                "name": "Aspirin",
                "dosage": "500mg",
                "use_case": "Pain Relief",
                "total_pills": 30
            },
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Aspirin"
        TestMediscanAPI.medication_id = data["id"]

    def test_add_schedule(self):
        response = client.post(
            f"/api/medications/{TestMediscanAPI.medication_id}/schedule",
            json={
                "time_of_day": "08:00",
                "days_of_week": "Mon,Wed,Fri"
            },
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["time_of_day"] == "08:00"
        TestMediscanAPI.schedule_id = data["id"]

    def test_log_medication_taken(self):
        # Log that the medication was taken
        response = client.post(
            f"/api/medications/log/{TestMediscanAPI.schedule_id}?status=taken",
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        assert response.status_code == 200
        
        # Verify the total pill count was decremented
        med_response = client.get(
            f"/api/medications/{TestMediscanAPI.profile_id}",
            headers={"Authorization": f"Bearer {TestMediscanAPI.token}"}
        )
        meds = med_response.json()
        assert len(meds) == 1
        assert meds[0]["remaining_pills"] == 29
