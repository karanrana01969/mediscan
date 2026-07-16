import os, json, shutil
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List

try:
    from .. import models, schemas, auth, database
except ImportError:
    import models, schemas, auth, database

router = APIRouter(prefix="/api/prescriptions", tags=["prescriptions"])

UPLOAD_DIR = "prescription_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ─── Create ───────────────────────────────────────────────────────────────

@router.post("/{profile_id}", response_model=schemas.PrescriptionOut)
async def create_prescription(
    profile_id: int,
    name: str,
    doctor_name: str = None,
    prescription_date: str = None,
    ai_extracted_json: str = None,
    file: UploadFile = File(None),
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    """Save a new prescription record with optional image/PDF attachment."""
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    image_path = None
    if file and file.filename:
        ext = os.path.splitext(file.filename)[1] or ".bin"
        filename = f"rx_{profile_id}_{os.urandom(4).hex()}{ext}"
        dest = os.path.join(UPLOAD_DIR, filename)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        image_path = dest

    rx = models.Prescription(
        profile_id=profile_id,
        name=name,
        doctor_name=doctor_name,
        prescription_date=prescription_date,
        ai_extracted_json=ai_extracted_json,
        image_path=image_path,
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)

    out = schemas.PrescriptionOut.model_validate(rx)
    out.medication_count = len(rx.medications)
    return out


# ─── List ─────────────────────────────────────────────────────────────────

@router.get("/{profile_id}", response_model=List[schemas.PrescriptionOut])
def list_prescriptions(
    profile_id: int,
    active_only: bool = False,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    """List all prescriptions for a profile (active + inactive unless filtered)."""
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    query = db.query(models.Prescription).filter(
        models.Prescription.profile_id == profile_id
    )
    if active_only:
        query = query.filter(models.Prescription.is_active == True)
    prescriptions = query.order_by(models.Prescription.created_at.desc()).all()

    results = []
    for rx in prescriptions:
        out = schemas.PrescriptionOut.model_validate(rx)
        out.medication_count = len(rx.medications)
        results.append(out)
    return results


# ─── Detail ───────────────────────────────────────────────────────────────

@router.get("/detail/{prescription_id}", response_model=schemas.PrescriptionOut)
def get_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    rx = db.query(models.Prescription).join(models.Profile).filter(
        models.Prescription.id == prescription_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    out = schemas.PrescriptionOut.model_validate(rx)
    out.medication_count = len(rx.medications)
    return out


# ─── Toggle active/inactive ───────────────────────────────────────────────

@router.patch("/{prescription_id}/toggle")
def toggle_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    rx = db.query(models.Prescription).join(models.Profile).filter(
        models.Prescription.id == prescription_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")
    rx.is_active = not rx.is_active
    db.commit()
    return {"id": rx.id, "is_active": rx.is_active}


# ─── Delete ───────────────────────────────────────────────────────────────

@router.delete("/{prescription_id}")
def delete_prescription(
    prescription_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    rx = db.query(models.Prescription).join(models.Profile).filter(
        models.Prescription.id == prescription_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not rx:
        raise HTTPException(status_code=404, detail="Prescription not found")

    # Unlink medications (don't delete them, just remove the reference)
    for med in rx.medications:
        med.prescription_id = None
    db.commit()

    # Remove file if exists
    if rx.image_path and os.path.exists(rx.image_path):
        os.remove(rx.image_path)

    db.delete(rx)
    db.commit()
    return {"message": "Prescription deleted"}


# ─── Alerts: medicines in active prescriptions not yet scheduled ──────────

@router.get("/{profile_id}/alerts/unscheduled")
def get_unscheduled_prescription_medicines(
    profile_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id),
):
    """
    Returns medicines from active prescriptions that have no corresponding
    active medication + schedule entry for this profile.
    """
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    active_rx = db.query(models.Prescription).filter(
        models.Prescription.profile_id == profile_id,
        models.Prescription.is_active == True
    ).all()

    # Current active medication names (lowercase for fuzzy match)
    active_meds = db.query(models.Medication).filter(
        models.Medication.profile_id == profile_id,
        models.Medication.is_active == True
    ).all()
    scheduled_names = {m.name.lower().strip() for m in active_meds if m.schedules}

    alerts = []
    for rx in active_rx:
        if not rx.ai_extracted_json:
            continue
        try:
            parsed = json.loads(rx.ai_extracted_json)
            medicines = parsed.get("medicines", [])
            for med in medicines:
                name = med.get("name", "")
                if name.lower().strip() not in scheduled_names:
                    alerts.append({
                        "prescription_id": rx.id,
                        "prescription_name": rx.name,
                        "doctor_name": rx.doctor_name,
                        "medicine_name": name,
                        "dosage": med.get("dosage"),
                        "frequency": med.get("frequency"),
                        "suggested_times": med.get("suggested_times"),
                        "suggested_days": med.get("suggested_days"),
                        "suggested_label": med.get("suggested_label"),
                    })
        except Exception:
            continue

    return {"alerts": alerts, "count": len(alerts)}
