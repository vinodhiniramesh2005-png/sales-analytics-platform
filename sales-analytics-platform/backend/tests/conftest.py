import os
import sys
import tempfile

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

TEST_DB_DIR = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB_DIR}/test.db"
os.environ["UPLOAD_DIR"] = os.path.join(TEST_DB_DIR, "uploads")
os.environ["REPORTS_DIR"] = os.path.join(TEST_DB_DIR, "reports")
os.environ["CHARTS_DIR"] = os.path.join(TEST_DB_DIR, "charts")
os.environ["SECRET_KEY"] = "test-secret-key"

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth_token(client):
    client.post(
        "/api/auth/register",
        json={"name": "Test Admin", "email": "test@example.com", "password": "password123"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123", "remember_me": False},
    )
    return res.json()["access_token"]


@pytest.fixture(scope="session")
def sample_csv():
    import pandas as pd

    path = os.path.join(TEST_DB_DIR, "sample.csv")
    df = pd.DataFrame({
        "Order Date": ["2024-01-01", "2024-01-02", "2024-02-01", "2024-02-15", "2024-01-01"],
        "Product": ["Widget A", "Widget B", "Widget A", "Widget C", "Widget A"],
        "Region": ["West", "East", "West", "North", "West"],
        "Customer": ["Alice", "Bob", "Alice", "Carol", "Alice"],
        "Revenue": [100.0, 200.0, 150.0, 50.0, 100.0],
        "Profit": [30.0, 60.0, 45.0, 10.0, 30.0],
    })
    df.to_csv(path, index=False)
    return path
