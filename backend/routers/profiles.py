from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
try:
    from .. import models, schemas, auth, database
except ImportError:
    import models, schemas, auth, database

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

@router.post("/", response_model=schemas.ProfileOut)
def create_profile(profile: schemas.ProfileCreate, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    try:
        # Check max profiles
        profiles_count = db.query(models.Profile).filter(models.Profile.user_id == current_user_id).count()
        if profiles_count >= 5:
            raise HTTPException(status_code=400, detail="Maximum 5 profiles allowed per account")

        new_profile = models.Profile(**profile.model_dump(), user_id=current_user_id)
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        return new_profile
    except Exception as e:
        db.rollback()
        print(f"DEBUG: Create Profile Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/", response_model=List[schemas.ProfileOut])
def get_profiles(db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    try:
        profiles = db.query(models.Profile).filter(models.Profile.user_id == current_user_id).all()
        return profiles
    except Exception as e:
        print(f"DEBUG: Fetch Profiles Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{profile_id}", response_model=schemas.ProfileOut)
def get_profile(profile_id: int, db: Session = Depends(database.get_db), current_user_id: int = Depends(auth.get_current_user_id)):
    profile = db.query(models.Profile).filter(models.Profile.id == profile_id, models.Profile.user_id == current_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
