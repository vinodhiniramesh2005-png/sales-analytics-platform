def test_register_and_login(client):
    res = client.post(
        "/api/auth/register",
        json={"name": "Alice", "email": "alice@example.com", "password": "securepass1"},
    )
    assert res.status_code == 201
    assert res.json()["email"] == "alice@example.com"

    res = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "securepass1", "remember_me": True},
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert "refresh_token" in body


def test_login_wrong_password(client):
    client.post(
        "/api/auth/register",
        json={"name": "Bob", "email": "bob@example.com", "password": "correctpass"},
    )
    res = client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "wrongpass", "remember_me": False},
    )
    assert res.status_code == 401


def test_me_requires_auth(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_with_token(client, auth_token):
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {auth_token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "test@example.com"


def test_forgot_password_does_not_leak_existence(client):
    res = client.post("/api/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert res.status_code == 200
    assert "message" in res.json()
