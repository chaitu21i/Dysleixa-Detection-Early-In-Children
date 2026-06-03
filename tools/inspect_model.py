"""Inspect attributes of an HDF5 Keras model file.

Usage:
    python tools/inspect_model.py path/to/hybrid_model.h5

This prints `keras_version`, `backend`, `model_config` snippet and top-level keys.
"""
import sys
import h5py

if len(sys.argv) < 2:
    print('Usage: python tools/inspect_model.py path/to/model.h5')
    sys.exit(1)

path = sys.argv[1]
with h5py.File(path, 'r') as f:
    print('File:', path)
    print('Keys:', list(f.keys()))
    print('Attrs:')
    for k in f.attrs:
        print('  ', k, ':', f.attrs.get(k))
    model_config = f.attrs.get('model_config')
    if model_config is not None:
        if isinstance(model_config, bytes):
            model_config = model_config.decode('utf-8', errors='ignore')
        print('\nmodel_config snippet:\n')
        print(model_config[:1000])
    else:
        print('\nNo model_config attribute found')
