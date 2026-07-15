from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
try:
    from .. import models, schemas, auth, database
except ImportError:
    import models, schemas, auth, database
import datetime

router = APIRouter(prefix="/api/medications", tags=["medications"])


def compute_days_remaining(med: models.Medication) -> Optional[int]:
    """How many days of supply are left based on schedule frequency."""
    if med.remaining_pills is None:
        return None
    doses_per_day = len(med.schedules) if med.schedules else 1
    if doses_per_day == 0:
        return None
    return med.remaining_pills // doses_per_day


# ─────────────────────────────────────────────
# Medication CRUD
# ─────────────────────────────────────────────

@router.post("/{profile_id}", response_model=schemas.MedicationOut)
def add_medication(
    profile_id: int,
    med: schemas.MedicationCreate,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    new_med = models.Medication(
        **med.model_dump(),
        profile_id=profile_id,
        remaining_pills=med.total_pills
    )
    db.add(new_med)
    db.commit()
    db.refresh(new_med)

    result = schemas.MedicationOut.model_validate(new_med)
    result.days_remaining = compute_days_remaining(new_med)
    return result


@router.get("/{profile_id}", response_model=List[schemas.MedicationOut])
def get_medications(
    profile_id: int,
    active_only: bool = True,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    query = db.query(models.Medication).filter(models.Medication.profile_id == profile_id)
    if active_only:
        query = query.filter(models.Medication.is_active == True)
    meds = query.all()

    results = []
    for med in meds:
        out = schemas.MedicationOut.model_validate(med)
        out.days_remaining = compute_days_remaining(med)
        results.append(out)
    return results


@router.get("/detail/{medication_id}", response_model=schemas.MedicationOut)
def get_medication_detail(
    medication_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    out = schemas.MedicationOut.model_validate(med)
    out.days_remaining = compute_days_remaining(med)
    return out


@router.put("/detail/{medication_id}", response_model=schemas.MedicationOut)
def update_medication(
    medication_id: int,
    med: schemas.MedicationCreate,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    db_med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    for key, value in med.model_dump(exclude_unset=True).items():
        setattr(db_med, key, value)
    db.commit()
    db.refresh(db_med)

    out = schemas.MedicationOut.model_validate(db_med)
    out.days_remaining = compute_days_remaining(db_med)
    return out


@router.delete("/detail/{medication_id}")
def delete_medication(
    medication_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    db_med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medication not found")

    db_med.is_active = False   # Soft delete — keep history
    db.commit()
    return {"message": "Medication deactivated"}


# ─────────────────────────────────────────────
# Schedule CRUD
# ─────────────────────────────────────────────

@router.post("/{medication_id}/schedule", response_model=schemas.ScheduleOut)
def add_schedule(
    medication_id: int,
    sched: schemas.ScheduleCreate,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    new_sched = models.Schedule(**sched.model_dump(), medication_id=medication_id)
    db.add(new_sched)
    db.commit()
    db.refresh(new_sched)
    return new_sched


@router.delete("/schedule/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    sched = db.query(models.Schedule).join(models.Medication).join(models.Profile).filter(
        models.Schedule.id == schedule_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")

    db.delete(sched)
    db.commit()
    return {"message": "Schedule removed"}


# ─────────────────────────────────────────────
# Today's Schedule
# ─────────────────────────────────────────────

@router.get("/today/{profile_id}", response_model=List[schemas.TodayDoseOut])
def get_today_schedule(
    profile_id: int,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Returns all dose slots for today with their taken/missed/upcoming status."""
    profile = db.query(models.Profile).filter(
        models.Profile.id == profile_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    today = datetime.date.today()
    day_name = today.strftime("%a")  # "Mon", "Tue", etc.
    now = datetime.datetime.now()

    meds = db.query(models.Medication).filter(
        models.Medication.profile_id == profile_id,
        models.Medication.is_active == True
    ).all()

    doses = []
    for med in meds:
        for sched in med.schedules:
            days = sched.days_of_week
            # Check if this schedule applies today
            is_today = (
                days.lower() == "everyday" or
                days.lower() == "daily" or
                day_name in days
            )
            if not is_today:
                continue

            # Build scheduled_at datetime
            try:
                hour, minute = map(int, sched.time_of_day.split(":"))
                scheduled_at = datetime.datetime.combine(today, datetime.time(hour, minute))
            except Exception:
                scheduled_at = None

            # Find today's log for this schedule slot
            log = None
            if scheduled_at:
                log = db.query(models.MedicationLog).filter(
                    models.MedicationLog.schedule_id == sched.id,
                    models.MedicationLog.scheduled_at == scheduled_at
                ).first()

            if log:
                status = log.status
                log_id = log.id
            elif scheduled_at and scheduled_at < now:
                status = "missed"
                log_id = None
            else:
                status = "upcoming"
                log_id = None

            doses.append(schemas.TodayDoseOut(
                schedule_id=sched.id,
                medication_id=med.id,
                medication_name=med.name,
                dosage=med.dosage,
                pill_color=med.pill_color,
                pill_shape=med.pill_shape,
                time_of_day=sched.time_of_day,
                label=sched.label,
                status=status,
                log_id=log_id,
                scheduled_at=scheduled_at
            ))

    # Sort by time
    doses.sort(key=lambda d: d.time_of_day)
    return doses


# ─────────────────────────────────────────────
# Medication Log (Mark Taken / Skipped)
# ─────────────────────────────────────────────

@router.post("/log/{schedule_id}", response_model=schemas.MedicationLogOut)
def log_medication(
    schedule_id: int,
    payload: schemas.MedicationLogCreate,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    sched = db.query(models.Schedule).join(models.Medication).join(models.Profile).filter(
        models.Schedule.id == schedule_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Prevent duplicate log for same scheduled_at slot
    if payload.scheduled_at:
        existing = db.query(models.MedicationLog).filter(
            models.MedicationLog.schedule_id == schedule_id,
            models.MedicationLog.scheduled_at == payload.scheduled_at
        ).first()
        if existing:
            # Update existing log instead
            existing.status = payload.status
            existing.notes = payload.notes
            existing.logged_at = datetime.datetime.utcnow()
            db.commit()
            db.refresh(existing)
            return existing

    log = models.MedicationLog(
        schedule_id=schedule_id,
        status=payload.status,
        scheduled_at=payload.scheduled_at,
        notes=payload.notes
    )
    db.add(log)

    # Decrement pill count when marked taken
    if payload.status.lower() == "taken":
        med = db.query(models.Medication).filter(
            models.Medication.id == sched.medication_id
        ).first()
        if med and med.remaining_pills and med.remaining_pills > 0:
            med.remaining_pills -= 1

    db.commit()
    db.refresh(log)
    return log


# ─────────────────────────────────────────────
# Restock
# ─────────────────────────────────────────────

@router.post("/restock/{medication_id}", response_model=schemas.RestockOut)
def restock_medication(
    medication_id: int,
    payload: schemas.RestockCreate,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    med = db.query(models.Medication).join(models.Profile).filter(
        models.Medication.id == medication_id,
        models.Profile.user_id == current_user_id
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found")

    med.remaining_pills = (med.remaining_pills or 0) + payload.pills_added
    new_total = med.remaining_pills

    restock = models.RestockLog(
        medication_id=medication_id,
        pills_added=payload.pills_added,
        new_total=new_total,
        notes=payload.notes
    )
    db.add(restock)
    db.commit()
    db.refresh(restock)
    return restock
