from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, DateTime, Text, Float
from sqlalchemy.orm import relationship
import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True) 
    google_id = Column(String, unique=True, index=True, nullable=True)
    trial_start_date = Column(DateTime, default=datetime.datetime.utcnow)
    is_premium = Column(Boolean, default=False)

    profiles = relationship("Profile", back_populates="owner", cascade="all, delete-orphan")

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    age = Column(Integer, nullable=True)
    health_info = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)

    owner = relationship("User", back_populates="profiles")
    medications = relationship("Medication", back_populates="profile", cascade="all, delete-orphan")
    scan_history = relationship("ScanHistory", back_populates="profile", cascade="all, delete-orphan")
    vitals = relationship("Vitals", back_populates="profile", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="profile", cascade="all, delete-orphan")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("profiles.id"))
    name = Column(String, index=True)
    use_case = Column(String, nullable=True)
    side_effects = Column(Text, nullable=True)
    dosage = Column(String, nullable=True)
    total_pills = Column(Integer, nullable=True) 
    remaining_pills = Column(Integer, nullable=True)

    profile = relationship("Profile", back_populates="medications")
    schedules = relationship("Schedule", back_populates="medication", cascade="all, delete-orphan")

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    time_of_day = Column(String) 
    days_of_week = Column(String) 

    medication = relationship("Medication", back_populates="schedules")
    logs = relationship("MedicationLog", back_populates="schedule", cascade="all, delete-orphan")

class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    status = Column(String) 
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    schedule = relationship("Schedule", back_populates="logs")

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
