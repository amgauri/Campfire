from app.services.matching import match_user, find_matches

def test_match_user():
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

    result = match_user(user, candidates)

    assert result["matched_user_id"] == 2
    assert result["match_score"] == 0.695

def test_find_matches():
    users = [
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

    result = find_matches(users)

    assert len(result) == 1
    assert result[0]["user_1"] == 1
    assert result[0]["user_2"] == 2
    assert result[0]["match_score"] == 0.695