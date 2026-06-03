import base64
import io
import numpy as np
from PIL import Image

def decode_image(base64_str):
    # supports dataURL "data:image/png;base64,...."
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]

    img_bytes = base64.b64decode(base64_str)
    img = Image.open(io.BytesIO(img_bytes)).convert("L")
    img = img.resize((64,64))
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = arr.reshape(1,64,64,1)
    return arr

def prepare_sequence(seq):
    arr = np.array(seq, dtype=np.float32).reshape((1, 32, 3))
    return arr
