from app.services.moderation import moderate_text


def test_safe_text():
    result = moderate_text("I really like this app")

    assert result["status"] == "safe"

def test_toxic_text():
    result = moderate_text("You are a stupid idiot")

    assert result["status"] == "block"