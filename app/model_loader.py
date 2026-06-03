import tensorflow as tf
import traceback
import json
import os

model = None
last_error = None
model_path = None


def attempt_model_migration(path):
    """Attempt to repair incompatible Keras HDF5 models."""

    try:
        import h5py
    except Exception as e:
        print("h5py not installed:", e)
        return None

    try:
        print(f"Opening HDF5 model: {path}")

        with h5py.File(path, "r") as f:

            print("HDF5 keys:", list(f.keys()))
            print("HDF5 attrs:", list(f.attrs.keys()))

            model_config_raw = None

            if "model_config" in f.attrs:
                model_config_raw = f.attrs["model_config"]
                print("Found model_config in attributes")

            elif "model_config" in f:
                model_config_raw = f["model_config"][()]
                print("Found model_config dataset")

            if model_config_raw is None:
                print("No model_config found")
                return None

            if isinstance(model_config_raw, bytes):
                model_config_raw = model_config_raw.decode("utf-8")

            cfg = json.loads(model_config_raw)

            print("Loaded config JSON")

            def fix_config(obj):

                if isinstance(obj, dict):

                    if "batch_shape" in obj and "batch_input_shape" not in obj:
                        obj["batch_input_shape"] = obj.pop("batch_shape")

                    if "dtype" in obj:
                        v = obj["dtype"]

                        if isinstance(v, str) and "DTypePolicy" in v:
                            obj["dtype"] = "float32"

                        if isinstance(v, dict) and v.get("class_name") == "DTypePolicy":
                            obj["dtype"] = "float32"

                    if "batch_input_shape" in obj and isinstance(
                        obj["batch_input_shape"], str
                    ):
                        obj["batch_input_shape"] = None

                    for k, v in obj.items():
                        fix_config(v)

                elif isinstance(obj, list):
                    for item in obj:
                        fix_config(item)

            print("Applying configuration fixes...")
            fix_config(cfg)

            new_json = json.dumps(cfg)

            print("Rebuilding model from modified JSON")

            custom_objects = {}

            try:
                from tensorflow.keras.mixed_precision import Policy

                custom_objects["DTypePolicy"] = Policy
            except Exception:
                pass

            try:
                rebuilt_model = tf.keras.models.model_from_json(
                    new_json, custom_objects=custom_objects
                )

                print("Model rebuilt successfully")

            except Exception as e:
                print("Failed rebuilding model:", e)
                traceback.print_exc()
                return None

            try:
                rebuilt_model.load_weights(path)
                print("Weights loaded successfully")
                return rebuilt_model

            except Exception as e:
                print("Failed loading weights:", e)
                traceback.print_exc()
                return None

    except Exception as e:
        print("Migration error:", e)
        traceback.print_exc()
        return None


def load_hybrid_model(path="hybrid_model.h5"):
    """Load the hybrid dyslexia model."""

    global model
    global last_error
    global model_path

    model_path = path

    if model is not None:
        return model

    try:
        print("Attempting normal model load...")

        model = tf.keras.models.load_model(path, compile=False)

        print("Model loaded successfully")
        last_error = None

    except Exception as e:

        print("Normal load failed:", e)
        traceback.print_exc()

        last_error = str(e)

        print("Attempting automatic migration...")

        migrated = attempt_model_migration(path)

        if migrated is not None:

            model = migrated
            last_error = None

            print("Model migration succeeded")

        else:

            print("Migration failed — model unavailable")
            model = None

    return model


def get_model_status():
    """Return model health status."""

    return {
        "loaded": model is not None,
        "path": model_path,
        "error": last_error,
    }


def reload_model(path=None):
    """Force reload model."""

    global model
    global last_error
    global model_path

    if path is None:
        path = model_path or "hybrid_model.h5"

    model = None
    last_error = None

    return load_hybrid_model(path)