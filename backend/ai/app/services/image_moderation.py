from transformers import pipeline
from PIL import Image

nsfw_model = pipeline(
    "image-classification",
    model="Falconsai/nsfw_image_detection"
)


def moderate_image(image_path: str):
    image = Image.open(image_path)

    results = nsfw_model(image)

    nsfw_score = next(
        item["score"]
        for item in results
        if item["label"].lower() == "nsfw"
    )

    if nsfw_score < 0.30:
        status = "safe"
    elif nsfw_score < 0.70:
        status = "review"
    else:
        status = "block"

    return {
        "status": status,
        "category": "nsfw",
        "confidence": round(nsfw_score, 4)
    }