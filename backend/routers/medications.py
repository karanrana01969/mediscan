from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from .. import models, auth, database

router = APIRouter(prefix="/api/medications", tags=["medications"])

class MedicationCreate(BaseModel):
    name: str
    use_case: str = None
    side_effects: str = None
    dosage: str = None
    total_pills: int = None

class ScheduleCreate(BaseModel):
    time_of_day: str
    days_of_week: str

@router.post("/{profile_id}")
def add_medication(profile_id: int, med: MedicationCreate, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id, models.Profile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    new_med = models.Medication(**med.model_dump(), profile_id=profile_id, remaining_pills=med.total_pills)
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return new_med

@router.get("/{profile_id}")
def get_medications(profile_id: int, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id, models.Profile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
        
    meds = db.query(models.Medication).filter(models.Medication.profile_id == profile_id).all()
    return meds

@router.post("/{medication_id}/schedule")
def add_schedule(medication_id: int, sched: ScheduleCreate, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    med = db.query(models.Medication).filter(models.Medication.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")
        
    new_sched = models.Schedule(**sched.model_dump(), medication_id=medication_id)
    db.add(new_sched)
    db.commit()
    db.refresh(new_sched)
    return new_sched

@router.post("/log/{schedule_id}")
def log_medication(schedule_id: int, status: str, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    sched = db.query(models.Schedule).filter(models.Schedule.id == schedule_id).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")
        
    log = models.MedicationLog(schedule_id=schedule_id, status=status)
    db.add(log)
    
    if status.lower() == "taken":
        med = db.query(models.Medication).filter(models.Medication.id == sched.medication_id).first()
        if med.remaining_pills and med.remaining_pills > 0:
            med.remaining_pills -= 1
            
    db.commit()
    db.refresh(log)
    return {"log": log, "message": f"Medication marked as {status}"}
