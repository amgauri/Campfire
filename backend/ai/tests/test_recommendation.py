from app.services.recommendation import rank_posts


def test_rank_posts():
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

    result = rank_posts(posts)

    assert len(result) == 3
    assert result[0]["id"] == 3