from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
try:
    from .. import models, schemas, auth, database
except ImportError:
    import models, schemas, auth, database
from pydantic import BaseModel
import os
import io
import PIL.Image
import google.generativeai as genai

router = APIRouter(prefix="/api/scan", tags=["scan"])

# Configured to use environment variable
genai.configure(api_key=os.environ.get("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY"))

PRESCRIPTION_PROMPT = """
You are a medical AI assistant. Analyze this prescription image and extract ALL medicines prescribed.
Return ONLY a JSON object with this exact structure:
{
  "doctor_name": "Dr. Name or null",
  "prescription_date": "YYYY-MM-DD or null",
  "medicines": [
    {
      "name": "Medicine name",
      "dosage": "e.g. 650mg",
      "frequency": "e.g. Once daily at night",
      "duration_days": 5,
      "suggested_times": ["21:00"],
      "suggested_days": "Everyday",
      "suggested_label": "Night"
    }
  ]
}
For suggested_times use 24h HH:MM. For suggested_label use one of: Morning, Afternoon, Evening, Night.
For suggested_days use: Everyday, or comma-separated day abbreviations like Mon,Wed,Fri.
If duration is not specified set duration_days to null.
"""

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

@router.post("/image")
async def identify_medicine_image(file: UploadFile = File(...), db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    prompt = """
    You are an AI assistant for an elderly care app. 
    Analyze the provided image of a medicine box or label.
    Identify the medicine and return ONLY a JSON with the following structure:
    {
        "name": "Medicine Name",
        "use_case": "Primary use case (e.g. Pain killer, Blood pressure)",
        "side_effects": "Main side effects in simple terms",
        "dosage": "Typical dosage instructions if any, otherwise 'Consult doctor'"
    }
    Make it easy for an elderly person to understand. No medical jargon if possible.
    """
    
    try:
        contents = await file.read()
        image = PIL.Image.open(io.BytesIO(contents))
        
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content([prompt, image])
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

@router.post("/prescription")
async def scan_prescription(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """
    Accepts a prescription image (jpg/png) or PDF.
    Returns structured JSON with doctor name, date, and list of all medicines.
    """
    try:
        contents = await file.read()
        content_type = file.content_type or ""
        model = genai.GenerativeModel('gemini-flash-latest')

        if "pdf" in content_type or (file.filename or "").lower().endswith(".pdf"):
            import tempfile
            with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
                tmp.write(contents)
                tmp_path = tmp.name
            uploaded = genai.upload_file(tmp_path, mime_type="application/pdf")
            response = model.generate_content([PRESCRIPTION_PROMPT, uploaded])
            import os as _os
            _os.unlink(tmp_path)
        else:
            image = PIL.Image.open(io.BytesIO(contents))
            response = model.generate_content([PRESCRIPTION_PROMPT, image])

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
