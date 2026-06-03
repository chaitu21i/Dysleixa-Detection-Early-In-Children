# Dyslexia Detection Early in Children

## Overview

Dyslexia is a common learning disorder that affects reading, writing, and spelling abilities in children. Early identification can significantly improve learning outcomes through timely intervention and personalized support.

This project presents an AI-powered Dyslexia Detection System that analyzes handwriting patterns and cognitive assessment activities to identify early signs of dyslexia in children. The system leverages Machine Learning and Deep Learning techniques to provide accurate predictions and support educational professionals in early diagnosis.

---

## Features

* Early detection of dyslexia in children
* Handwriting analysis using Deep Learning
* Interactive cognitive assessment games
* Automated prediction and reporting
* User-friendly web interface
* Fast and accurate model inference
* Educational screening support

---

## Technology Stack

### Frontend

* HTML
* CSS
* JavaScript

### Backend

* Python
* FastAPI

### Machine Learning & Deep Learning

* TensorFlow
* Keras
* NumPy
* OpenCV
* Scikit-Learn

### Database

* SQLite

---

## Project Structure

```text
backend/
│
├── app/
│   ├── main.py
│   ├── model.py
│   ├── preprocess.py
│   ├── handwriting_analyzer.py
│   ├── model_loader.py
│   └── db.py
│
├── static/
│   ├── home_page.html
│   ├── signup.html
│   ├── memory_match.html
│   ├── rapid_naming_game.html
│   └── other assessment activities
│
├── hybrid_model.h5
├── requirements.txt
├── serve.py
└── README.md
```

---

## How It Works

1. Child participates in assessment activities.
2. Handwriting samples and activity results are collected.
3. Data is preprocessed and analyzed.
4. Deep Learning model evaluates patterns associated with dyslexia.
5. Prediction results are generated.
6. Educators and parents can review the assessment outcome.

---

## Installation

### Clone Repository

```bash
git clone https://github.com/chaitu21i/Dysleixa-Detection-Early-In-Children.git
cd Dysleixa-Detection-Early-In-Children
```

### Create Virtual Environment

```bash
python -m venv .venv
```

### Activate Environment

Windows:

```bash
.venv\Scripts\activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Running the Application

### Start Backend Server

```bash
python serve.py
```

or

```bash
uvicorn app.main:app --reload
```

### Open Browser

```text
http://127.0.0.1:8000
```

---

## Model Information

The project utilizes a hybrid deep learning model trained on handwriting and cognitive assessment data.

Model Files:

* hybrid_model.h5
* hybrid_model_saved/

The model predicts the likelihood of dyslexia based on extracted features and assessment performance.

---

## Future Enhancements

* Real-time handwriting recognition
* Explainable AI predictions
* Mobile application support
* Multilingual assessment system
* Parent and teacher dashboards
* Cloud deployment

---

## Applications

* Schools
* Educational Institutions
* Child Development Centers
* Learning Disability Screening Programs
* Research Organizations

---

## Author

**Meenaga Chaitanya**

* B.Tech Computer Science Engineering (2026)
* Data Science & AI Enthusiast


## License

This project is developed for educational and research purposes. Feel free to use and enhance it with proper attribution.
