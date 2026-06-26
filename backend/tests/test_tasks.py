from fastapi.testclient import TestClient
from app.main import app

# Instantiate the TestClient with our FastAPI app
client = TestClient(app)

def test_create_task_unauthorized():
    """
    Attempts to POST a new task to /tasks/ without a valid JWT bearer token.
    Expects a 401 Unauthorized response because the endpoint is protected by RequireRole/get_current_active_user.
    """
    payload = {
        "title": "Unauthorized Task",
        "description": "This task creation attempt should be blocked by the API's RBAC.",
        "status": "Pending",
        "priority": "High"
    }
    
    # Intentionally sending without an Authorization header
    response = client.post("/tasks/", json=payload)
    
    # Assert the request is blocked by FastAPI security dependencies
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}

def test_get_tasks_unauthorized():
    """
    Attempts to GET /tasks/ without a valid JWT bearer token.
    Expects a 401 Unauthorized response.
    """
    # Intentionally sending without an Authorization header
    response = client.get("/tasks/")
    
    # Assert the request is blocked
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}
