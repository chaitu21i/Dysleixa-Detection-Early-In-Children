Colab: Convert hybrid_model.h5 → SavedModel

Steps to run in Google Colab (copy & paste into a cell):

1) Upload `hybrid_model.h5` into Colab (use the left Files pane > Upload)

2) Inspect file metadata to pick a compatible TensorFlow version:

```python
import h5py
f = h5py.File('/content/hybrid_model.h5','r')
print('keras_version:', f.attrs.get('keras_version'))
print('backend:', f.attrs.get('backend'))
print('keys:', list(f.keys()))
# Optionally print a snippet of model_config
mc = f.attrs.get('model_config')
if mc is not None:
    if isinstance(mc, bytes):
        mc = mc.decode('utf-8')
    print('model_config (snippet):', mc[:400])
f.close()
```

Note the `keras_version` value (e.g. `2.3.1`, `2.4.0`). Use it to choose a matching TensorFlow release below.

3) Install a matching TensorFlow release. Examples:

- If `keras_version` is 2.3.x use `tensorflow==2.3.0`
- If `keras_version` is 2.4.x use `tensorflow==2.4.1`
- If 2.2.x use `tensorflow==2.2.0`
- If unknown, try `tensorflow==2.4.1` first.

In Colab:
```python
# install a compatible TF (change the version to match your keras_version)
!pip install -q 'tensorflow==2.4.1'
```

4) Load the HDF5 model and save as a SavedModel directory:

```python
from tensorflow.keras.models import load_model
m = load_model('/content/hybrid_model.h5')
# Save as SavedModel format
m.save('/content/hybrid_model_saved', save_format='tf')
print('SavedModel written to /content/hybrid_model_saved')
```

5) Download the SavedModel directory (zip it first):

```python
!zip -r /content/hybrid_model_saved.zip /content/hybrid_model_saved
```

Then use the Files pane to download `hybrid_model_saved.zip` to your machine and place its extracted folder in your server workspace (for example next to `app/`), then update `app.model.get_model()` to load the SavedModel (pass the folder path to `tf.keras.models.load_model`).

Notes & troubleshooting
- If load_model fails with a custom object error (DTypePolicy or similar), prefer using the exact TF/Keras version that the HDF5 was created with (check `keras_version` and try several nearby patch versions).
- If the model still cannot be loaded, re-export from the original training environment as SavedModel (recommended) or share the `model_config` snippet so I can advise further.