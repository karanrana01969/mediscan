import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import auth, profiles, scan, medications, notifications, history, prescriptions
from scheduler import start_scheduler, stop_scheduler

models.Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    start_scheduler()
    yield
    # ── Shutdown ──
    stop_scheduler()


app = FastAPI(title="Mediscan API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(scan.router)
app.include_router(medications.router)
app.include_router(notifications.router)
app.include_router(history.router)
app.include_router(prescriptions.router)


@app.get("/")
def read_root():
    return {"message": "Welcome to Mediscan API v2", "status": "running"}

