from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, auth, database
from pydantic import BaseModel
import os
import google.generativeai as genai

router = APIRouter(prefix="/api/scan", tags=["scan"])

# Configured to use environment variable
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"))

class ScanRequest(BaseModel):
    ocr_text: str

class InteractionRequest(BaseModel):
    new_medicine: str

@router.post("/")
def identify_medicine(request: ScanRequest, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    prompt = f"""
    You are an AI assistant for an elderly care app. 
    Analyze this extracted text from a medicine box: '{request.ocr_text}'.
    Identify the medicine and return ONLY a JSON with the following structure:
    {{
        "name": "Medicine Name",
        "use_case": "Primary use case (e.g. Pain killer, Blood pressure)",
        "side_effects": "Main side effects in simple terms",
        "dosage": "Typical dosage instructions if any, otherwise 'Consult doctor'"
    }}
    Make it easy for an elderly person to understand. No medical jargon if possible.
    """
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        import json
        data = json.loads(raw_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/interaction/{profile_id}")
def check_interaction(profile_id: int, request: InteractionRequest, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id, models.Profile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    current_meds = db.query(models.Medication).filter(models.Medication.profile_id == profile_id).all()
    med_names = [med.name for med in current_meds]
    
    if not med_names:
        return {"warning": False, "message": "No existing medications to interact with."}
        
    meds_list = ", ".join(med_names)
    prompt = f"""
    An elderly person is currently taking these medications: {meds_list}.
    They are about to take a new medication: {request.new_medicine}.
    Is there a known dangerous interaction? 
    Return ONLY a JSON with:
    {{
        "warning": true or false,
        "message": "A simple explanation of the interaction, or 'Safe to take' if no major interaction"
    }}
    """
    try:
        model = genai.GenerativeModel('gemini-pro')
        response = model.generate_content(prompt)
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        import json
        data = json.loads(raw_text)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
