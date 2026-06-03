import tensorflow as tf
import keras

print("TensorFlow version:", tf.__version__)
print("Keras version:", keras.__version__)

# load using legacy keras loader
model = keras.models.load_model("hybrid_model.h5", compile=False)

print("Model loaded successfully")

# re-save in modern format
model.save("hybrid_model_fixed.keras")

print("Model converted successfully → hybrid_model_fixed.keras")