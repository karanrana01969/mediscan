from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, auth, database
import datetime

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/{medication_id}/logs", response_model=List[schemas.MedicationLogOut])
def get_medication_logs(
    medication_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Full log history for a specific medication, newest first."""
    med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    logs = (
        db.query(models.MedicationLog)
        .join(models.Schedule)
        .filter(models.Schedule.medication_id == medication_id)
        .order_by(models.MedicationLog.logged_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return logs


@router.get("/{medication_id}/restock", response_model=List[schemas.RestockOut])
def get_restock_history(
    medication_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """All restock events for a medication."""
    med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    logs = (
        db.query(models.RestockLog)
        .filter(models.RestockLog.medication_id == medication_id)
        .order_by(models.RestockLog.restocked_at.desc())
        .all()
    )
    return logs


@router.get("/{profile_id}/adherence", response_model=schemas.AdherenceStats)
def get_adherence_stats(
    profile_id: int,
    days: int = 30,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Adherence stats across all medications for a profile over the last N days."""
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    since = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    logs = (
        db.query(models.MedicationLog)
        .join(models.Schedule)
        .join(models.Medication)
        .filter(
            models.Medication.profile_id == profile_id,
            models.MedicationLog.logged_at >= since
        )
        .all()
    )

    total = len(logs)
    taken = sum(1 for l in logs if l.status == "taken")
    missed = sum(1 for l in logs if l.status == "missed")
    skipped = sum(1 for l in logs if l.status == "skipped")
    rate = (taken / total) if total > 0 else 0.0

    return schemas.AdherenceStats(
        total_doses=total,
        taken=taken,
        missed=missed,
        skipped=skipped,
        adherence_rate=round(rate, 2)
    )


@router.get("/{profile_id}/low-stock")
def get_low_stock_medications(
    profile_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Returns all medications that are below their low_stock_threshold in days."""
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    meds = db.query(models.Medication).filter(
        models.Medication.profile_id == profile_id,
        models.Medication.is_active == True
    ).all()

    low_stock = []
    for med in meds:
        if med.remaining_pills is None:
            continue
        doses_per_day = max(len(med.schedules), 1)
        days_left = med.remaining_pills // doses_per_day
        if days_left <= med.low_stock_threshold:
            low_stock.append({
                "medication_id": med.id,
                "name": med.name,
                "remaining_pills": med.remaining_pills,
                "days_left": days_left,
                "threshold_days": med.low_stock_threshold
            })
    return low_stock
