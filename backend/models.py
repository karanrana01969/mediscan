from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, DateTime, Text, Float, Time
from sqlalchemy.orm import relationship
import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    trial_start_date = Column(DateTime, default=datetime.datetime.utcnow)
    is_premium = Column(Boolean, default=False)

    profiles = relationship("Profile", back_populates="owner", cascade="all, delete-orphan")
    notification_tokens = relationship("NotificationToken", back_populates="user", cascade="all, delete-orphan")


class Prescription(Base):
    """A doctor's prescription uploaded by the user for a specific profile."""
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    name = Column(String)                          # User-given name e.g. "Dr. Sharma - July 2026"
    doctor_name = Column(String, nullable=True)
    prescription_date = Column(Date, nullable=True)
    image_path = Column(String, nullable=True)     # Local filesystem path to stored image/PDF
    ai_extracted_json = Column(Text, nullable=True) # Full JSON string of AI extraction result
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="prescriptions")
    medications = relationship("Medication", back_populates="prescription")


class NotificationToken(Base):
    """Stores FCM device tokens per user for push notifications."""
    __tablename__ = "notification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, unique=True, index=True)
    platform = Column(String, default="android")  # "android" | "ios"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notification_tokens")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    age = Column(Integer, nullable=True)
    health_info = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    avatar_color = Column(String, default="#4F46E5")  # UI color for profile avatar

    owner = relationship("User", back_populates="profiles")
    medications = relationship("Medication", back_populates="profile", cascade="all, delete-orphan")
    scan_history = relationship("ScanHistory", back_populates="profile", cascade="all, delete-orphan")
    vitals = relationship("Vitals", back_populates="profile", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="profile", cascade="all, delete-orphan")
    prescriptions = relationship("Prescription", back_populates="profile", cascade="all, delete-orphan")


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=True)  # optional link
    name = Column(String, index=True)
    use_case = Column(String, nullable=True)
    side_effects = Column(Text, nullable=True)
    dosage = Column(String, nullable=True)
    doctor_notes = Column(Text, nullable=True)

    # Inventory tracking
    total_pills = Column(Integer, nullable=True)
    remaining_pills = Column(Integer, nullable=True)
    low_stock_threshold = Column(Integer, default=7)  # warn when remaining < 7 days supply

    # Duration / treatment window
    duration_days = Column(Integer, nullable=True)   # total treatment duration in days
    start_date = Column(Date, nullable=True)          # when the course started

    # Pill identification (stored locally on device, path shared here for reference)
    pill_color = Column(String, nullable=True)         # e.g. "white", "yellow"
    pill_shape = Column(String, nullable=True)         # e.g. "round", "oval"

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="medications")
    prescription = relationship("Prescription", back_populates="medications")
    schedules = relationship("Schedule", back_populates="medication", cascade="all, delete-orphan")
    restock_logs = relationship("RestockLog", back_populates="medication", cascade="all, delete-orphan")


class Schedule(Base):
    """One row = one daily time slot for a medication (e.g. 08:00 AM every Mon/Wed/Fri)."""
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    time_of_day = Column(String)     # "HH:MM" in 24h format, e.g. "08:00"
    days_of_week = Column(String)    # comma-separated: "Mon,Tue,Wed,Thu,Fri,Sat,Sun" or "Everyday"
    label = Column(String, nullable=True)  # "Morning", "Afternoon", "Evening", "Night"
    notification_minutes_before = Column(Integer, default=15)  # remind N mins before

    medication = relationship("Medication", back_populates="schedules")
    logs = relationship("MedicationLog", back_populates="schedule", cascade="all, delete-orphan")


class MedicationLog(Base):
    """Tracks every time a scheduled dose is taken, missed, or skipped."""
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    # "taken" | "missed" | "skipped"
    status = Column(String)
    # The exact datetime this dose was scheduled for (for deduplication & history)
    scheduled_at = Column(DateTime, nullable=True)
    # When user actually acted on it
    logged_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    schedule = relationship("Schedule", back_populates="logs")


class RestockLog(Base):
    """Records every time pills were refilled/restocked."""
    __tablename__ = "restock_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    pills_added = Column(Integer)
    new_total = Column(Integer)   # remaining_pills after restock
    restocked_at = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True)

    medication = relationship("Medication", back_populates="restock_logs")


class ScanHistory(Base):
    __tablename__ = "scan_history"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    medicine_name = Column(String, index=True)
    scan_date = Column(DateTime, default=datetime.datetime.utcnow)
    result_summary = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="scan_history")


class Vitals(Base):
    __tablename__ = "vitals"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    blood_pressure = Column(String, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    blood_sugar = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    profile = relationship("Profile", back_populates="vitals")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    doctor_name = Column(String)
    appointment_date = Column(DateTime)
    notes = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="appointments")


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String, unique=True, index=True)
    config_value = Column(String)
