from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)

def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "campfire-ai"
    }

def test_moderate_text():
    response = client.post(
        "/moderate/text",
        json={"text": "I really like this app"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "safe"

def test_recommend():
    posts = [
        {
            "id": 1,
            "likes": 120,
            "comments": 25,
            "created_at": "2026-09-30T10:00:00",
            "user_interacted": True
        },
        {
            "id": 2,
            "likes": 80,
            "comments": 10,
            "created_at": "2026-09-29T10:00:00",
            "user_interacted": False
        },
        {
            "id": 3,
            "likes": 200,
            "comments": 40,
            "created_at": "2026-09-28T10:00:00",
            "user_interacted": True
        }
    ]

    response = client.post(
        "/recommend",
        json={"posts": posts}
    )

    assert response.status_code == 200
    assert response.json()[0]["id"] == 3

def test_match():
    user = {
        "id": 1,
        "interests": ["ai", "gaming", "music"],
        "active": True,
        "wait_minutes": 2
    }

    candidates = [
        {
            "id": 1,
            "interests": ["ai", "gaming", "music"],
            "active": True,
            "wait_minutes": 2
        },
        {
            "id": 2,
            "interests": ["ai", "gaming", "photography"],
            "active": True,
            "wait_minutes": 3
        },
        {
            "id": 3,
            "interests": ["sports", "fitness"],
            "active": True,
            "wait_minutes": 1
        }
    ]

    response = client.post(
        "/match",
        json={
            "user": user,
            "candidates": candidates
        }
    )

    assert response.status_code == 200
    assert response.json()["matched_user_id"] == 2

def test_matches():
    candidates = [
        {
            "id": 1,
            "interests": ["ai", "gaming", "music"],
            "active": True,
            "wait_minutes": 2
        },
        {
            "id": 2,
            "interests": ["ai", "gaming", "photography"],
            "active": True,
            "wait_minutes": 3
        },
        {
            "id": 3,
            "interests": ["sports", "fitness"],
            "active": True,
            "wait_minutes": 1
        }
    ]

    response = client.post(
        "/matches",
        json={"candidates": candidates}
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["user_1"] == 1
    assert response.json()[0]["user_2"] == 2