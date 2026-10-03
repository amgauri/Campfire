from transformers import pipeline

# Load the pretrained toxicity detection model
toxicity_model = pipeline(
    "text-classification",
    model="unitary/toxic-bert"
)


def moderate_text(text: str):
    result = toxicity_model(text)[0]

    score = result["score"]

    if score < 0.30:
        status = "safe"
    elif score < 0.70:
        status = "review"
    else:
        status = "block"

    return {
        "status": status,
        "category": result["label"],
        "confidence": round(score, 4)
    }