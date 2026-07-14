import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI
import models
from database import engine
from routers import auth, profiles, scan, medications

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mediscan API")

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(scan.router)
app.include_router(medications.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Mediscan API"}
