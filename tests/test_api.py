import pytest
from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)

def test_get_activities_returns_all():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect activities to be a dict with known keys
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    test_email = "tester@example.com"

    # Ensure test_email is not already present
    if test_email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(test_email)

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": test_email})
    assert resp.status_code == 200
    json = resp.json()
    assert "Signed up" in json.get("message", "")
    assert test_email in activities[activity]["participants"]

    # Try duplicate signup -> should return 400
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": test_email})
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/participants", params={"email": test_email})
    assert resp3.status_code == 200
    assert test_email not in activities[activity]["participants"]

    # Unregister again -> should 404
    resp4 = client.delete(f"/activities/{activity}/participants", params={"email": test_email})
    assert resp4.status_code == 404
