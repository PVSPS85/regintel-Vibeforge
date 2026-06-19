from fastapi.testclient import TestClient
from app.main import app

# Instantiate the TestClient with our FastAPI app
client = TestClient(app)

def test_request_access_invalid_branch():
    """
    Sends a POST request to /auth/request-access with a fake branch code.
    Expects a 404 response because the branch doesn't exist in the database.
    """
    payload = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "testpassword123",
        "branch_code": "FAKE_BRANCH_XYZ_999"
    }
    
    response = client.post("/auth/request-access", json=payload)
    
    # Assert we get a 404 Not Found error
    assert response.status_code == 404

def test_login_missing_credentials():
    """
    Sends a POST request to /auth/login without a password.
    Expects a 422 Validation Error from FastAPI's OAuth2PasswordRequestForm validation.
    """
    payload = {
        "username": "testuser@example.com"
        # Intentional omission of 'password'
    }
    
    # Login uses application/x-www-form-urlencoded data
    response = client.post("/auth/login", data=payload)
    
    # Assert we get a 422 Unprocessable Entity error
    assert response.status_code == 422

def test_login_invalid_credentials():
    """
    Sends a POST request to /auth/login with a non-existent user.
    Expects a 401 Unauthorized response.
    """
    payload = {
        "username": "ghost_user_999@example.com",
        "password": "random_password"
    }
    
    response = client.post("/auth/login", data=payload)
    
    # Assert we get a 401 Unauthorized error
    assert response.status_code == 401
