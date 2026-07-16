"""
Medication Reminder Scheduler
------------------------------
Runs every minute inside the FastAPI process (via APScheduler).
For each Schedule row whose time_of_day matches the current HH:MM
and whose days_of_week includes today, it sends a FCM push notification
to all registered devices of the profile's owner.
"""

import datetime
import logging

import firebase_admin
from firebase_admin import credentials, messaging
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session

import models
from database import SessionLocal

logger = logging.getLogger(__name__)

# ── Firebase Admin init (safe to call multiple times) ──────────────────────
def _init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred)


# ── Core reminder logic ────────────────────────────────────────────────────
def send_medication_reminders():
    """Called every minute by APScheduler."""
    _init_firebase()

    db: Session = SessionLocal()
    try:
        now = datetime.datetime.now()
        current_time = now.strftime("%H:%M")          # e.g. "08:30"
        today_abbr   = now.strftime("%a")             # e.g. "Mon"

        # Pull all active schedules whose time matches now
        schedules = (
            db.query(models.Schedule)
            .join(models.Medication)
            .filter(
                models.Schedule.time_of_day == current_time,
                models.Medication.is_active == True,
            )
            .all()
        )

        for sched in schedules:
            # Check if today is one of the scheduled days
            days = sched.days_of_week or ""
            is_today = (
                days.lower() in ("everyday", "daily")
                or today_abbr in days
            )
            if not is_today:
                continue

            med     = sched.medication
            profile = med.profile
            user_id = profile.user_id

            # Get all FCM tokens for this user
            tokens = (
                db.query(models.NotificationToken)
                .filter(models.NotificationToken.user_id == user_id)
                .all()
            )
            if not tokens:
                continue

            label   = sched.label or "Reminder"
            title   = f"💊 {label}: {med.name}"
            body    = f"Time to take {med.dosage or 'your dose'} of {med.name}."

            for t in tokens:
                try:
                    msg = messaging.Message(
                        notification=messaging.Notification(title=title, body=body),
                        data={
                            "screen":        "Dashboard",
                            "schedule_id":   str(sched.id),
                            "medication_id": str(med.id),
                            "profile_id":    str(profile.id),
                        },
                        android=messaging.AndroidConfig(priority="high"),
                        token=t.token,
                    )
                    messaging.send(msg)
                    logger.info(
                        "Reminder sent | user=%s med=%s schedule=%s token=...%s",
                        user_id, med.name, sched.id, t.token[-6:],
                    )
                except Exception as e:
                    logger.warning("FCM send failed for token ...%s: %s", t.token[-6:], e)

    except Exception as e:
        logger.error("Scheduler error: %s", e)
    finally:
        db.close()


# ── Scheduler setup ────────────────────────────────────────────────────────
_scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def start_scheduler():
    """Call this once at FastAPI startup."""
    _init_firebase()
    _scheduler.add_job(
        send_medication_reminders,
        trigger="cron",
        minute="*",          # every minute
        id="med_reminders",
        replace_existing=True,
        misfire_grace_time=30,
    )
    _scheduler.start()
    logger.info("✅ Medication reminder scheduler started (every minute, IST)")


def stop_scheduler():
    """Call this at FastAPI shutdown."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
