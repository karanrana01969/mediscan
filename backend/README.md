# Mediscan Backend API

This is the FastAPI backend for the Mediscan mobile application. It handles user authentication, profile management, and AI-powered medication scanning.

## Authentication Endpoints

- **`POST /api/auth/signup`**: Creates a new user account.
  - Payload: `{"email": "user@example.com", "password": "password"}`
  - Returns: `{ "access_token": "...", "token_type": "bearer" }`
- **`POST /api/auth/login`**: Authenticates an existing user and returns a JWT token.
  - Payload: `{"email": "user@example.com", "password": "password"}`
  - Returns: `{ "access_token": "...", "token_type": "bearer" }`

## Profiles Endpoints

- **`POST /api/profiles/`**: Create a new patient profile linked to the logged-in user.
  - Header: `Authorization: Bearer <token>`
  - Payload: `{"name": "Elderly Father", "age": 75, "relation": "Father"}`
- **`GET /api/profiles/`**: Fetch all profiles linked to the current user.
- **`GET /api/profiles/{id}`**: Fetch a specific profile by ID along with its medications and schedules.

## Scanner Endpoints (AI)

- **`POST /api/scan/`**: Scans the OCR text from a medication and uses Google's Gemini AI to break down the information.
  - Header: `Authorization: Bearer <token>`
  - Payload: `{"ocr_text": "Aspirin 500mg"}`
  - Returns: Medication name, use case, side effects, and dosage instructions.
- **`POST /api/scan/interaction/{profile_id}`**: Checks if a new medication interacts dangerously with any existing medications the patient is currently taking.

## Medications & Scheduling Endpoints

- **`POST /api/medications/{profile_id}`**: Saves a newly scanned medication to a patient's profile.
  - Header: `Authorization: Bearer <token>`
  - Payload: `{"name": "...", "use_case": "...", "side_effects": "...", "dosage": "...", "total_pills": 30}`
- **`GET /api/medications/{profile_id}`**: Gets all medications and their schedules for a specific profile.
- **`POST /api/medications/{medication_id}/schedule`**: Adds a recurring schedule to a medication.
  - Payload: `{"time_of_day": "08:00", "days_of_week": "Mon,Wed,Fri"}`
- **`POST /api/medications/log/{schedule_id}?status=taken`**: Logs that a scheduled medication was taken, which automatically decrements the remaining pill count for that medication.
