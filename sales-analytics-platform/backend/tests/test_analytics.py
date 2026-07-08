import pytest


@pytest.fixture(scope="module")
def upload_id(client, auth_token, sample_csv):
    with open(sample_csv, "rb") as f:
        res = client.post(
            "/api/uploads",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("sample2.csv", f, "text/csv")},
        )
    return res.json()["id"]


def test_dataset_pagination(client, auth_token, upload_id):
    res = client.get(f"/api/datasets/{upload_id}?page=1&page_size=2", headers={"Authorization": f"Bearer {auth_token}"})
    assert res.status_code == 200
    body = res.json()
    assert len(body["rows"]) <= 2
    assert body["total_rows"] == 4


def test_chat_total_sales(client, auth_token, upload_id):
    res = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"upload_id": upload_id, "question": "What is total sales?"},
    )
    assert res.status_code == 200
    assert "total sales" in res.json()["answer"].lower()


def test_chat_best_product(client, auth_token, upload_id):
    res = client.post(
        "/api/chat",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"upload_id": upload_id, "question": "Best selling product"},
    )
    assert res.status_code == 200
    assert "widget a" in res.json()["answer"].lower()


def test_charts_overview(client, auth_token, upload_id):
    res = client.get(f"/api/charts/{upload_id}/overview", headers={"Authorization": f"Bearer {auth_token}"})
    assert res.status_code == 200
    assert "bar_top_products" in res.json()


def test_forecast_endpoint(client, auth_token, upload_id):
    res = client.get(
        f"/api/forecast/{upload_id}?horizon_days=7", headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert res.status_code == 200
    body = res.json()
    assert len(body["forecast"]) == 7


def test_report_data(client, auth_token, upload_id):
    res = client.get(f"/api/report/{upload_id}/data", headers={"Authorization": f"Bearer {auth_token}"})
    assert res.status_code == 200
    assert "executive_summary" in res.json()


def test_report_pdf(client, auth_token, upload_id):
    res = client.get(f"/api/report/{upload_id}/pdf", headers={"Authorization": f"Bearer {auth_token}"})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"


def test_access_denied_for_other_user(client, upload_id):
    client.post(
        "/api/auth/register",
        json={"name": "Other User", "email": "other@example.com", "password": "password123"},
    )
    login = client.post(
        "/api/auth/login",
        json={"email": "other@example.com", "password": "password123", "remember_me": False},
    )
    other_token = login.json()["access_token"]
    res = client.get(f"/api/datasets/{upload_id}", headers={"Authorization": f"Bearer {other_token}"})
    assert res.status_code == 403
