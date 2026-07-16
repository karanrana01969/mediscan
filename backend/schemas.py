from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, date


# ─────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str


# ─────────────────────────────────────────────
# Notification Token
# ─────────────────────────────────────────────

class FCMTokenRegister(BaseModel):
    token: str
    platform: str = "android"  # "android" | "ios"


# ─────────────────────────────────────────────
# Prescription
# ─────────────────────────────────────────────

class ExtractedMedicine(BaseModel):
    """One medicine entry as extracted by AI from a prescription image."""
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None          # e.g. "Once daily at night"
    duration_days: Optional[int] = None
    suggested_times: Optional[List[str]] = None  # e.g. ["21:00"]
    suggested_days: Optional[str] = None         # e.g. "Everyday"
    suggested_label: Optional[str] = None        # e.g. "Night"

class PrescriptionScanResult(BaseModel):
    """Full AI extraction result from a prescription image."""
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None
    medicines: List[ExtractedMedicine] = []

class PrescriptionCreate(BaseModel):
    name: str                                    # User-given name
    doctor_name: Optional[str] = None
    prescription_date: Optional[str] = None      # ISO date string
    ai_extracted_json: Optional[str] = None      # JSON string of PrescriptionScanResult

class PrescriptionOut(BaseModel):
    id: int
    profile_id: int
    name: str
    doctor_name: Optional[str]
    prescription_date: Optional[str]
    image_path: Optional[str]
    ai_extracted_json: Optional[str]
    is_active: bool
    created_at: datetime
    medication_count: int = 0                    # how many meds linked to this prescription

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Profile
# ─────────────────────────────────────────────

class ProfileBase(BaseModel):
    name: str
    age: Optional[int] = None
    health_info: Optional[str] = None
    allergies: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    avatar_color: Optional[str] = "#4F46E5"

class ProfileCreate(ProfileBase):
    pass

class ProfileOut(ProfileBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Schedule
# ─────────────────────────────────────────────

class ScheduleCreate(BaseModel):
    time_of_day: str            # "HH:MM"
    days_of_week: str           # "Everyday" or "Mon,Wed,Fri"
    label: Optional[str] = None # "Morning" / "Afternoon" / "Evening" / "Night"
    notification_minutes_before: int = 15

class ScheduleOut(BaseModel):
    id: int
    medication_id: int
    time_of_day: str
    days_of_week: str
    label: Optional[str]
    notification_minutes_before: int

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Medication
# ─────────────────────────────────────────────

class MedicationCreate(BaseModel):
    name: str
    use_case: Optional[str] = None
    side_effects: Optional[str] = None
    dosage: Optional[str] = None
    doctor_notes: Optional[str] = None
    total_pills: Optional[int] = None
    duration_days: Optional[int] = None
    start_date: Optional[date] = None
    pill_color: Optional[str] = None
    pill_shape: Optional[str] = None
    low_stock_threshold: int = 7
    prescription_id: Optional[int] = None       # optional link to a prescription

class MedicationOut(BaseModel):
    id: int
    profile_id: int
    name: str
    use_case: Optional[str]
    side_effects: Optional[str]
    dosage: Optional[str]
    doctor_notes: Optional[str]
    total_pills: Optional[int]
    remaining_pills: Optional[int]
    duration_days: Optional[int]
    start_date: Optional[date]
    pill_color: Optional[str]
    pill_shape: Optional[str]
    low_stock_threshold: int
    is_active: bool
    created_at: datetime
    schedules: List[ScheduleOut] = []
    days_remaining: Optional[int] = None   # computed field
    prescription_id: Optional[int] = None
    prescription_name: Optional[str] = None  # denormalized for display

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Medication Log
# ─────────────────────────────────────────────

class MedicationLogCreate(BaseModel):
    status: str                          # "taken" | "missed" | "skipped"
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None

class MedicationLogOut(BaseModel):
    id: int
    schedule_id: int
    status: str
    scheduled_at: Optional[datetime]
    logged_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Restock
# ─────────────────────────────────────────────

class RestockCreate(BaseModel):
    pills_added: int
    notes: Optional[str] = None

class RestockOut(BaseModel):
    id: int
    medication_id: int
    pills_added: int
    new_total: int
    restocked_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# Today's schedule response
# ─────────────────────────────────────────────

class TodayDoseOut(BaseModel):
    schedule_id: int
    medication_id: int
    medication_name: str
    dosage: Optional[str]
    pill_color: Optional[str]
    pill_shape: Optional[str]
    time_of_day: str
    label: Optional[str]
    status: Optional[str]    # "taken" | "missed" | "upcoming" | None
    log_id: Optional[int]
    scheduled_at: Optional[datetime]


# ─────────────────────────────────────────────
# Adherence Stats
# ─────────────────────────────────────────────

class AdherenceStats(BaseModel):
    total_doses: int
    taken: int
    missed: int
    skipped: int
    adherence_rate: float   # 0.0 – 1.0
