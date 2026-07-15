from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas, auth, database

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/token")
def register_token(
    payload: schemas.FCMTokenRegister,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Register or refresh the FCM push token for this device/user."""
    existing = db.query(models.NotificationToken).filter(
        models.NotificationToken.user_id == current_user_id,
        models.NotificationToken.token == payload.token
    ).first()

    if existing:
        existing.platform = payload.platform
        db.commit()
        return {"message": "Token updated"}

    token_entry = models.NotificationToken(
        user_id=current_user_id,
        token=payload.token,
        platform=payload.platform
    )
    db.add(token_entry)
    db.commit()
    return {"message": "Token registered"}


@router.delete("/token")
def remove_token(
    token: str,
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """Remove a specific FCM token (called on logout)."""
    db.query(models.NotificationToken).filter(
        models.NotificationToken.user_id == current_user_id,
        models.NotificationToken.token == token
    ).delete()
    db.commit()
    return {"message": "Token removed"}


@router.get("/tokens")
def list_tokens(
    db: Session = Depends(database.get_db),
    current_user_id: int = Depends(auth.get_current_user_id)
):
    """List all registered FCM tokens for the current user."""
    tokens = db.query(models.NotificationToken).filter(
        models.NotificationToken.user_id == current_user_id
    ).all()
    return tokens
