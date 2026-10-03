from datetime import datetime
def normalize(value, min_value, max_value):
    if max_value == min_value:
        return 0

    return (value - min_value) / (max_value - min_value)

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

def calculate_freshness(created_at):
    post_time = datetime.fromisoformat(created_at)
    now = datetime.now()

    age_hours = (now - post_time).total_seconds() / 3600

    freshness = 1 / (1 + age_hours / 24)

    return round(freshness, 4)

def calculate_score(post, posts):
    likes_values = [p["likes"] for p in posts]
    comments_values = [p["comments"] for p in posts]

    likes_score = normalize(
        post["likes"],
        min(likes_values),
        max(likes_values)
    )

    comments_score = normalize(
        post["comments"],
        min(comments_values),
        max(comments_values)
    )

    freshness_score = calculate_freshness(
        post["created_at"]
    )

    interaction_score = 1 if post["user_interacted"] else 0

    score = (
        0.30 * likes_score +
        0.20 * comments_score +
        0.30 * freshness_score +
        0.20 * interaction_score
    )

    return round(score, 4)

def rank_posts(posts, limit=20):
    ranked = sorted(
        posts,
        key=lambda post: calculate_score(post, posts),
        reverse=True
    )

    return [
        {
            "id": post["id"],
            "score": calculate_score(post, posts)
        }
        for post in ranked[:limit]
    ]