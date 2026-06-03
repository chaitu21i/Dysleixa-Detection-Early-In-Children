import tensorflow as tf
import numpy as np
from pathlib import Path
from PIL import Image

_MODEL = None
_SERVE_FN = None


# -------------------------------
# Load SavedModel
# -------------------------------
def get_model():
    global _MODEL, _SERVE_FN

    if _MODEL is not None:
        return _MODEL, _SERVE_FN

    print("Loading SavedModel...")

    model_path = Path(__file__).resolve().parent.parent / "hybrid_model_saved"

    _MODEL = tf.saved_model.load(str(model_path))

    # get serving function
    _SERVE_FN = _MODEL.signatures["serve"]

    print("Model loaded successfully")

    return _MODEL, _SERVE_FN


# -------------------------------
# Image preprocessing
# -------------------------------
def preprocess_image(image: Image.Image):

    image = image.convert("L")
    image = image.resize((64, 64))

    img = np.array(image) / 255.0
    img = img.reshape(1, 64, 64, 1)

    return img


# -------------------------------
# Prediction
# -------------------------------
def predict_handwriting(image: Image.Image):

    model, serve_fn = get_model()

    img_input = preprocess_image(image)

    # second input for hybrid model
    seq_input = np.zeros((1, 32, 3), dtype=np.float32)

    result = serve_fn(
        Image_Input_Standalone=tf.constant(img_input, dtype=tf.float32),
        Sequential_Input=tf.constant(seq_input, dtype=tf.float32),
    )

    prediction = next(iter(result.values())).numpy()

    score = float(np.max(prediction))

    if score < 0.4:
        risk = "Low"
    elif score < 0.7:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "score": score,
        "risk_level": risk,
    }