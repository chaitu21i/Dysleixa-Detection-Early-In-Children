"""
Main FastAPI app for the Learning Dyslexia project.

This server:
- Serves the main HTML hub
- Provides APIs for speech, handwriting, and final dyslexia analysis
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import os
import io
import logging
import traceback
from typing import Optional

from PIL import Image

from app import model_loader
from app import handwriting_analyzer


# ================================================
# FastAPI App
# ================================================

app = FastAPI(title="Learning Dyslexia Hub")

logging.basicConfig(level=logging.INFO)

# Enable CORS (for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================
# Serve Main HTML Page
# ================================================

@app.get("/")
async def serve_home():
    """Serve the hub HTML page."""

    static_dir = os.path.join(os.path.dirname(__file__), "..", "static")

    new_page = os.path.join(static_dir, "home_page_new.html")
    home_file = os.path.join(static_dir, "home_page.html")
    enhanced = os.path.join(static_dir, "home_page_enhanced.html")

    if os.path.exists(new_page):
        return FileResponse(new_page, media_type="text/html")

    if os.path.exists(home_file):
        return FileResponse(home_file, media_type="text/html")

    if os.path.exists(enhanced):
        return FileResponse(enhanced, media_type="text/html")

    raise HTTPException(status_code=404, detail="home page not found")


# Serve static files
app.mount("/static", StaticFiles(directory="static", html=True), name="static")


# ================================================
# 1️⃣ Speech Check API
# ================================================

class SpeechRequest(BaseModel):
    speechScore: float = Field(..., ge=0.0, le=1.0)


class SpeechResponse(BaseModel):
    speechScore: float
    message: str


@app.post("/speech-check", response_model=SpeechResponse)
async def speech_check(req: SpeechRequest):

    return {
        "speechScore": req.speechScore,
        "message": "Speech score recorded successfully",
    }


# ================================================
# 2️⃣ Handwriting Prediction API
# ================================================

@app.post("/handwriting-check")
async def handwriting_check(file: UploadFile = File(...)):

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        logging.info(f"Received image: {file.filename}, size: {image.size}")

    except Exception as e:
        logging.error(f"Failed to read image: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")

    try:

        result = handwriting_analyzer.analyze_handwriting_image(image)

        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Handwriting analysis failed"),
            )

        final_score = result.get("final_score", 0.5)

        logging.info(
            f"Handwriting analysis complete: "
            f"text={result['detected_text']}, "
            f"language={result['language']['name']}, "
            f"score={final_score}"
        )

        return {
            "handwritingScore": final_score,
            "detectedText": result.get("detected_text", ""),
            "language": result.get("language", {}),
            "ocrConfidence": result.get("ocr_confidence", 0),
            "handwritingQuality": result.get("handwriting_score", 0),
            "dyslexiaRiskLevel": result.get("dyslexia_risk_level", "Unknown"),
            "dyslexiaIndicators": result.get("dyslexia_indicators", []),
        }

    except FileNotFoundError as e:
        logging.error(f"Model not found: {e}")
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        logging.error(f"Handwriting analysis error: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Handwriting analysis failed: {str(e)}",
        )


# ================================================
# 3️⃣ Final Dyslexia Risk Analyzer
# ================================================

class FinalRequest(BaseModel):
    speechScore: float = Field(..., ge=0.0, le=1.0)
    handwritingScore: float = Field(..., ge=0.0, le=1.0)
    gamesScore: float = Field(default=0.0, ge=0.0, le=1.0)


class FinalResponse(BaseModel):
    speechScore: float
    handwritingScore: float
    gamesScore: float
    finalScore: float
    riskLevel: str
    message: str


@app.post("/final-check", response_model=FinalResponse)
async def final_check(req: FinalRequest):

    final_score = (
        (0.3 * req.speechScore)
        + (0.3 * req.handwritingScore)
        + (0.4 * req.gamesScore)
    )

    if final_score < 0.35:
        risk_level = "Low"
        message = "Great job! You're doing excellent! 🌟"

    elif final_score < 0.65:
        risk_level = "Medium"
        message = "Good progress! Keep practicing! 💪"

    else:
        risk_level = "High"
        message = "You're working hard! Keep going! 🎯"

    logging.info(
        f"Final check -> speech={req.speechScore}, "
        f"handwriting={req.handwritingScore}, "
        f"games={req.gamesScore}, "
        f"final={final_score}, level={risk_level}"
    )

    return {
        "speechScore": req.speechScore,
        "handwritingScore": req.handwritingScore,
        "gamesScore": req.gamesScore,
        "finalScore": final_score,
        "riskLevel": risk_level,
        "message": message,
    }


# ================================================
# 4️⃣ Final Dyslexia Risk Analyzer with XAI
# ================================================

@app.post("/final-analysis-xai")
async def final_analysis_xai(req: FinalRequest):
    """Final analysis with explainable AI (XAI) insights."""

    final_score = (
        (0.3 * req.speechScore)
        + (0.3 * req.handwritingScore)
        + (0.4 * req.gamesScore)
    )

    if final_score < 0.35:
        risk_level = "Low"
        message = "Great job! You're doing excellent! 🌟"
    elif final_score < 0.65:
        risk_level = "Medium"
        message = "Good progress! Keep practicing! 💪"
    else:
        risk_level = "High"
        message = "You're working hard! Keep going! 🎯"

    # Calculate contribution percentages
    speech_contribution = round(req.speechScore * 30)
    handwriting_contribution = round(req.handwritingScore * 30)
    games_contribution = round(req.gamesScore * 40)
    
    # Normalize to ensure they sum to 100
    total = speech_contribution + handwriting_contribution + games_contribution
    if total > 0:
        speech_contribution = round((speech_contribution / total) * 100)
        handwriting_contribution = round((handwriting_contribution / total) * 100)
        games_contribution = 100 - speech_contribution - handwriting_contribution

    # Generate XAI explanations
    speech_findings = []
    if req.speechScore > 0.7:
        speech_findings.append("Strong speech processing abilities detected")
    elif req.speechScore > 0.4:
        speech_findings.append("Moderate speech processing skills")
    else:
        speech_findings.append("Speech processing may need support")

    handwriting_findings = []
    if req.handwritingScore > 0.7:
        handwriting_findings.append("Good handwriting quality and clarity")
    elif req.handwritingScore > 0.4:
        handwriting_findings.append("Handwriting shows some inconsistencies")
    else:
        handwriting_findings.append("Handwriting patterns suggest areas for improvement")

    game_findings = []
    if req.gamesScore > 0.7:
        game_findings.append("Excellent performance across learning games")
    elif req.gamesScore > 0.4:
        game_findings.append("Moderate game performance")
    else:
        game_findings.append("Practice with more games recommended")

    # Generate summary
    if risk_level == "Low":
        summary = "Overall dyslexia risk is low. Continue maintaining current learning pace."
    elif risk_level == "Medium":
        summary = "Some areas show potential challenges. Targeted practice recommended."
    else:
        summary = "Comprehensive support and targeted interventions recommended."

    # Generate recommendations
    recommendations = []
    if req.speechScore < 0.5:
        recommendations.append("Focus on phonetic awareness exercises")
    if req.handwritingScore < 0.5:
        recommendations.append("Practice letter formation and spacing")
    if req.gamesScore < 0.5:
        recommendations.append("Engage more frequently with learning games")
    
    if not recommendations:
        recommendations.append("Continue current learning activities")

    logging.info(
        f"Final XAI analysis -> speech={req.speechScore}, "
        f"handwriting={req.handwritingScore}, "
        f"games={req.gamesScore}, "
        f"final={final_score}, level={risk_level}"
    )

    return {
        "speechScore": req.speechScore,
        "handwritingScore": req.handwritingScore,
        "gamesScore": req.gamesScore,
        "finalScore": final_score,
        "riskLevel": risk_level,
        "message": message,
        "contribution": {
            "speech": {
                "label": "Speech",
                "percentage": speech_contribution,
                "score": speech_contribution,
                "color": "#FF6B6B"
            },
            "handwriting": {
                "label": "Handwriting",
                "percentage": handwriting_contribution,
                "score": handwriting_contribution,
                "color": "#4ECDC4"
            },
            "games": {
                "label": "Games",
                "percentage": games_contribution,
                "score": games_contribution,
                "color": "#FFE66D"
            }
        },
        "explanation": {
            "speech_findings": speech_findings,
            "handwriting_findings": handwriting_findings,
            "game_findings": game_findings,
            "summary": summary
        },
        "recommendations": recommendations
    }


# ================================================
# Model Status API
# ================================================

@app.get("/model-status")
async def model_status():
    """Check if model loaded successfully."""

    try:
        return model_loader.get_model_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ================================================
# Reload Model API
# ================================================

@app.post("/reload-model")
async def reload_model(path: Optional[str] = None):

    try:
        m = model_loader.reload_model(path)

        return {
            "reloaded": m is not None,
            "status": model_loader.get_model_status(),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reload failed: {e}")