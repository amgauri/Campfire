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


# Users who have previously had a positive interaction
positive_interactions = {
    (1, 2)
}


def calculate_interest_score(user_a, user_b):
    interests_a = set(user_a["interests"])
    interests_b = set(user_b["interests"])

    if not interests_a or not interests_b:
        return 0

    shared_interests = interests_a.intersection(interests_b)
    total_interests = interests_a.union(interests_b)

    return round(
        len(shared_interests) / len(total_interests),
        4
    )


def calculate_activity_score(user_a, user_b):
    if user_a["active"] and user_b["active"]:
        return 1.0

    return 0.0


def calculate_interaction_score(user_a, user_b):
    pair = (user_a["id"], user_b["id"])
    reverse_pair = (user_b["id"], user_a["id"])

    if pair in positive_interactions or reverse_pair in positive_interactions:
        return 1.0

    return 0.0


def calculate_wait_score(user_a, user_b):
    max_wait = max(
        user_a["wait_minutes"],
        user_b["wait_minutes"]
    )

    return min(max_wait / 10, 1.0)


def calculate_match_score(user_a, user_b):
    interest_score = calculate_interest_score(
        user_a,
        user_b
    )

    activity_score = calculate_activity_score(
        user_a,
        user_b
    )

    interaction_score = calculate_interaction_score(
        user_a,
        user_b
    )

    wait_score = calculate_wait_score(
        user_a,
        user_b
    )

    score = (
        0.40 * interest_score +
        0.25 * activity_score +
        0.20 * interaction_score +
        0.15 * wait_score
    )

    return round(score, 4)


def find_best_match(user, users):
    best_match = None
    best_score = -1

    for candidate in users:
        if candidate["id"] == user["id"]:
            continue

        if not candidate["active"]:
            continue

        score = calculate_match_score(
            user,
            candidate
        )

        if score > best_score:
            best_score = score
            best_match = candidate

    if best_match is None:
        return None

    return {
        "user_id": best_match["id"],
        "score": best_score
    }


def match_user(user, candidates):
    result = find_best_match(
        user,
        candidates
    )

    if result is None or result["score"] < 0.30:
        return {
            "matched_user_id": None,
            "match_score": 0
        }

    return {
        "matched_user_id": result["user_id"],
        "match_score": result["score"]
    }

def find_matches(users):
    matched_pairs = []
    matched_user_ids = set()

    for user in users:
        if user["id"] in matched_user_ids:
            continue

        result = find_best_match(user, users)

        if result is None:
            continue

        candidate_id = result["user_id"]

        if candidate_id in matched_user_ids:
            continue

        if result["score"] < 0.30:
            continue

        matched_pairs.append({
            "user_1": user["id"],
            "user_2": candidate_id,
            "match_score": result["score"]
        })

        matched_user_ids.add(user["id"])
        matched_user_ids.add(candidate_id)

    return matched_pairs
