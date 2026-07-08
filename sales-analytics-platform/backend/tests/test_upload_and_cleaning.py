from app.services.cleaning import clean_dataframe, normalize_header
import pandas as pd


def test_normalize_header():
    assert normalize_header("Order Date") == "order_date"
    assert normalize_header("  Revenue ($) ") == "revenue"
    assert normalize_header("Customer-Name") == "customername"


def test_clean_dataframe_removes_duplicates_and_fixes_types():
    df = pd.DataFrame({
        "Order Date": ["2024-01-01", "2024-01-01", "2024-01-02"],
        "Revenue": ["100", "100", "200"],
        "Customer": [" Alice ", " Alice ", "Bob"],
    })
    cleaned, summary = clean_dataframe(df.copy())
    assert summary["duplicates_removed"] == 1
    assert summary["rows_after"] == 2
    assert "order_date" in cleaned.columns
    assert cleaned["customer"].iloc[0] == "Alice"


def test_upload_requires_auth(client):
    res = client.post("/api/uploads", files={"file": ("test.csv", b"a,b\n1,2\n", "text/csv")})
    assert res.status_code == 401


def test_upload_rejects_bad_extension(client, auth_token):
    res = client.post(
        "/api/uploads",
        headers={"Authorization": f"Bearer {auth_token}"},
        files={"file": ("test.txt", b"a,b\n1,2\n", "text/plain")},
    )
    assert res.status_code == 400


def test_upload_and_clean_sample_csv(client, auth_token, sample_csv):
    with open(sample_csv, "rb") as f:
        res = client.post(
            "/api/uploads",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"file": ("sample.csv", f, "text/csv")},
        )
    assert res.status_code == 201
    body = res.json()
    assert body["row_count"] == 4  # one duplicate row removed
    assert body["status"] == "cleaned"
