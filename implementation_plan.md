# Mediscan — Full App Brainstorm & Implementation Plan

## What We're Building

**Mediscan** is a medication management app primarily designed for elderly patients and caregivers. A caregiver (family member, nurse, etc.) can manage one or multiple patient profiles. The app handles the full lifecycle of a medication — from scanning/adding it, building a schedule, tracking daily adherence, sending notifications, and monitoring inventory until restock is needed.

---

## ✅ Decisions Locked In

| Decision | Choice |
|---|---|
| **Notifications** | Firebase Cloud Messaging (FCM) — collect device token on login, clear on logout |
| **Database** | SQLite (migrate to PostgreSQL later) |
| **Pill images** | Store locally on device (no server upload needed) |
| **Vitals / Appointments** | Deferred to Phase 3 |
| **Phase priority** | Phase 1 → Phase 2 → Phase 3 |

---

## 🔍 Current State Audit

### What Already Exists

**Backend (FastAPI + SQLite)**
| Area | Status |
|---|---|
| User auth (email/password + Google OAuth) | ✅ Done |
| Profile CRUD | ✅ Done |
| Medication CRUD (name, use_case, dosage, side_effects, total/remaining pills) | ✅ Done |
| Schedule model (time_of_day, days_of_week as strings) | ✅ Basic |
| MedicationLog (status: taken/missed, timestamp) | ✅ Basic |
| AI Scan (image + OCR text → Gemini → medication info) | ✅ Done |
| Drug Interaction Check | ✅ Done |
| Vitals, Appointments, ScanHistory models | ✅ Models only, no full routers |

**Mobile (React Native 0.86 + TypeScript)**
| Screen | Status |
|---|---|
| Login / Signup | ✅ Done |
| ProfilesScreen (list/create profiles) | ✅ Done |
| ScannerScreen (camera/gallery → AI analysis → save) | ✅ Done |
| ScheduleScreen (list meds + mark taken) | ✅ Partial |
| Navigation (stack-based) | ✅ Basic |

### What's Missing / Broken

**Critical Gaps:**
- ❌ No notification system (missed dose, low stock, restock reminders)
- ❌ Schedule creation UI — no way to set times/days per medication from the app
- ❌ No medication detail screen (history, logs, restock info)
- ❌ No "Add Schedule" flow connected to UI
- ❌ `total_pills` hardcoded to `30` in scanner save
- ❌ No pill image storage
- ❌ No "days supply" calculation (how many days current stock lasts)
- ❌ Navigation doesn't go Profile → Dashboard, it goes Profile → Scanner directly
- ❌ No bottom tab navigation (everything is stack only)
- ❌ Vitals & Appointments have models but no screens/routes
- ❌ No medication history/timeline view
- ❌ No restock logging
- ❌ Schedule model uses plain strings (no proper time parsing/multiple slots)
- ❌ No notification token storage in backend

---

## 👤 Complete User Journey

```
1. ONBOARDING
   Splash Screen → Login / Signup → (JWT stored)

2. PROFILE SELECTION / DASHBOARD
   → Select or create a Patient Profile
   → Profile Dashboard (summary cards: medications, upcoming doses, low stock alerts)

3. ADD MEDICATION
   Option A: Scan (camera/gallery → AI identifies med)
   Option B: Manual Entry (type name, dosage, use case, side effects)
   → Confirm/Edit AI result
   → Enter pill details: total_pills, pill_image (optional)
   → Set Schedule: frequency (1x/2x/3x/day), specific times, days of week
   → Drug Interaction Check runs automatically
   → Save → back to Profile Dashboard

4. DAILY SCHEDULE VIEW
   → Today's timeline: all medications grouped by time slot
   → Each slot shows: pill name, dosage, image (if saved), time
   → "Mark as Taken" button → logs with timestamp
   → "Mark as Skipped" option
   → Visual indicator: taken ✅ / missed ❌ / upcoming ⏰

5. NOTIFICATIONS (background service)
   → Reminder X minutes before scheduled time
   → Missed dose alert (if not marked within buffer time)
   → Low stock warning (when remaining pills < N days supply)
   → Restock reminder

6. MEDICATION DETAIL SCREEN
   → Full info (name, use case, dosage, side effects)
   → Pill image
   → Remaining pills + days supply estimate
   → Adherence stats (taken/missed this week/month)
   → Full log history (date, time, taken/missed)
   → Restock button → enter new pill count

7. HISTORY & REPORTS
   → Per-medication history timeline
   → Overall adherence score
   → When last restocked
   → Export/share report (optional)

8. PROFILE MANAGEMENT
   → Edit profile details (name, age, health info, allergies)
   → Manage multiple profiles
   → Delete profile

9. EXTRAS (suggested enhancements)
   → Vitals tracking (BP, heart rate, blood sugar)
   → Doctor appointments calendar
   → Drug interaction checker (before adding new med)
   → Emergency contact info on profile
   → Caregiver notes
```

---

## 🏗️ Proposed Changes

### Phase 1 — Core Schedule & Tracking (Most Critical)

---

#### Backend

##### [MODIFY] [models.py](file:///home/ditsdev/Desktop/karan.rana/Mediscan/backend/models.py)
- **Schedule**: Add `notification_minutes_before` (int), rename `time_of_day` → store as proper `Time` or keep ISO string but multiple entries. Best approach: one `Schedule` row = one time slot (already correct). Add `start_date`, `end_date`, `duration_days` to Medication.
- **Medication**: Add `pill_image_path` (String), `duration_days` (int), `start_date` (Date). Computed: `days_remaining = remaining_pills / (doses_per_day)`.
- **MedicationLog**: Add `scheduled_time` (DateTime) so we know which slot was logged, add `notes` (Text).
- **RestockLog**: NEW model — `medication_id`, `pills_added`, `timestamp`, `notes`.
- **NotificationToken**: NEW model — `user_id`, `token`, `platform` (ios/android).

##### [MODIFY] [routers/medications.py](file:///home/ditsdev/Desktop/karan.rana/Mediscan/backend/routers/medications.py)
- `POST /{profile_id}` — accept `pill_image` as file upload, `duration_days`, `start_date`
- `GET /{profile_id}` — return full nested schedules + today's logs
- `GET /{medication_id}/detail` — full detail with logs, restock history, adherence stats
- `POST /{medication_id}/restock` — add pills, create RestockLog
- `GET /{profile_id}/today` — today's schedule with slot-level taken/missed status
- `POST /log/{schedule_id}` — improve: accept `scheduled_time`, auto-decrement pills, handle buffer logic

##### [NEW] routers/notifications.py
- `POST /notifications/token` — register device push token
- `POST /notifications/test` — send a test notification (dev only)

##### [NEW] routers/history.py
- `GET /history/{medication_id}` — paginated log history
- `GET /history/{profile_id}/adherence` — adherence stats (week/month)
- `GET /history/{profile_id}/report` — full summary

##### [MODIFY] [routers/scan.py](file:///home/ditsdev/Desktop/karan.rana/Mediscan/backend/routers/scan.py)
- Return `warnings` field consistently (currently missing)
- Add `total_pills` suggestion from scanned label if detectable

---

#### Mobile

##### [NEW] src/navigation/AppNavigator.tsx
- Replace flat stack with **Bottom Tab Navigator** (Today | Medications | History | Profile)
- Auth stack (Login, Signup) separate from main app stack
- Persist auth token in AsyncStorage on login

##### [MODIFY] [App.tsx](file:///home/ditsdev/Desktop/karan.rana/Mediscan/mobile/App.tsx)
- Wire up new navigator, add SafeAreaProvider, add notification setup

##### [NEW] src/screens/SplashScreen.tsx
- Logo animation, check stored token, redirect accordingly

##### [NEW] src/screens/DashboardScreen.tsx (replaces ProfilesScreen as home)
- Today's medications summary
- Upcoming doses timeline
- Low stock alerts
- Quick access to add medication

##### [MODIFY] src/screens/ProfilesScreen.tsx
- Add profile selection → navigate to Dashboard (not Scanner)
- Add allergies field
- Add emergency contact field

##### [NEW] src/screens/AddMedicationScreen.tsx
- Manual entry form (name, use_case, dosage, side_effects, total_pills, duration_days)
- Upload pill photo
- Drug interaction auto-check on name entry
- Form validation

##### [MODIFY] src/screens/ScannerScreen.tsx
- After AI result → navigate to `AddMedicationScreen` with pre-filled data (not direct save)
- Fix: don't hardcode `total_pills: 30`

##### [NEW] src/screens/SetScheduleScreen.tsx
- Choose frequency (once/twice/three times/custom per day)
- Pick specific times with time picker
- Choose days of week (Mon–Sun toggles or "Every day")
- Set notification buffer (e.g., remind 15 min before)
- Preview schedule before saving

##### [MODIFY] src/screens/ScheduleScreen.tsx → **TodayScreen.tsx**
- Timeline view grouped by time (Morning / Afternoon / Evening / Night)
- Each card: pill image, name, dosage, time, taken/skipped buttons
- Color coding: taken=green, missed=red, upcoming=blue
- Pull-to-refresh

##### [NEW] src/screens/MedicationDetailScreen.tsx
- Full medication info
- Pill image (large)
- Remaining pills + days supply progress bar
- Adherence rate (weekly/monthly)
- Log history timeline
- Edit schedule button
- Restock button (modal to enter new count)
- Delete medication (with confirmation)

##### [NEW] src/screens/HistoryScreen.tsx
- Calendar heatmap or list view of adherence per day
- Filter by medication or date range
- Missed doses highlighted

##### [NEW] src/services/notificationService.ts
- Request push notification permissions
- Register device token with backend
- Handle foreground/background notification display
- Local notification scheduling (react-native-push-notification or notifee)

##### [NEW] src/services/storageService.ts
- AsyncStorage wrapper for auth token, selected profile, user preferences

##### [MODIFY] src/services/api.js → api.ts
- Add request interceptor: attach JWT from storage on every request
- Add response interceptor: handle 401 → redirect to login
- Convert to TypeScript

---

### Phase 2 — Notifications & Background Jobs

##### Backend: Notification Worker
- Cron job (APScheduler or Celery) that runs every minute
- Checks upcoming schedules, fires push notifications via FCM (Firebase Cloud Messaging)
- Checks remaining pills threshold → sends low stock alert

##### Mobile
- Integrate `@notifee/react-native` or `react-native-push-notification`
- Handle notification tap → navigate to correct medication/schedule

---

### Phase 3 — Vitals, Appointments & Reports

- Build out Vitals screen (log BP, heart rate, sugar)
- Build Appointments screen (calendar view, add doctor appointments)
- Export adherence report as PDF or share as text

---

## 📱 Screen Map (Final)

```
Auth Stack
├── SplashScreen
├── LoginScreen ✅ (exists)
└── SignupScreen ✅ (exists)

Main App (Bottom Tabs)
├── Tab: Today (TodayScreen) — daily schedule + mark taken
├── Tab: Medications (MedicationsListScreen) → MedicationDetailScreen
├── Tab: History (HistoryScreen)
└── Tab: Profile (ProfileScreen / ProfilesScreen)

Modals / Push Screens
├── AddMedicationScreen (from scanner result or manual)
├── SetScheduleScreen
├── ScannerScreen
└── RestockModal
```

---

## 💡 Additional Suggested Features

| Feature | Why |
|---|---|
| **Caregiver Mode** | One account managing multiple elderly patients — already supported via Profiles |
| **Medication Interaction Alert** | Auto-runs when adding a new med — already built, just needs to surface in UI |
| **"Almost Empty" Badge** | Red badge on medication when < 7 days supply remaining |
| **Daily Adherence Score** | Gamification — "You took 5/6 medications today 🎉" |
| **Emergency Contact on Profile** | Critical for elderly care — show on profile detail |
| **Missed Dose Escalation** | If missed, notify caregiver's phone number via SMS/push (Phase 3) |
| **Doctor Notes Field** | Per-medication notes for doctor instructions |
| **Medication Color/Shape** | Help elderly identify pills visually (color picker + shape selector) |
| **Multi-language Support** | For elderly users who aren't native English speakers |
| **Voice Input** | For elderly users who struggle typing |

---

## 🛠️ What YOU Need to Do (External Setup)

These are tasks only you can do — no code involved. Complete these before or during Phase 2 (Notifications).

---

### 🔥 Firebase Setup (Required for Phase 2 — Notifications)

> [!IMPORTANT]
> You need a Firebase project set up before notifications can work. Here are the exact steps:

**Step 1 — Create Firebase Project**
- Go to [https://console.firebase.google.com](https://console.firebase.google.com)
- Click **"Add Project"**
- Name it `Mediscan` (or similar)
- Disable Google Analytics (not needed) → **Create Project**

**Step 2 — Add Android App to Firebase**
- In your Firebase project → click **"Add app"** → choose Android (🤖)
- **Android package name**: Find it in `mobile/android/app/build.gradle` → look for `applicationId` (e.g., `com.mediscan`)
- Download the `google-services.json` file
- Place it at: `mobile/android/app/google-services.json`

**Step 3 — Add iOS App to Firebase** *(if you're building for iOS too)*
- Click **"Add app"** → choose iOS (🍎)
- **Bundle ID**: Find it in `mobile/ios/<AppName>/Info.plist` → `CFBundleIdentifier`
- Download the `GoogleService-Info.plist` file
- Place it at: `mobile/ios/GoogleService-Info.plist`

**Step 4 — Get your Server Key / Service Account (for backend to send notifications)**
- In Firebase Console → **Project Settings** (gear icon)
- Go to **"Service accounts"** tab
- Click **"Generate new private key"** → download the JSON file
- Save it as `backend/firebase-service-account.json`
- ⚠️ Add this file to `.gitignore` — never commit it!

**Step 5 — Note your Project ID**
- In Firebase Console → **Project Settings** → General tab
- Copy your **Project ID** (e.g., `mediscan-abc123`)
- You'll add this to `backend/.env` as `FIREBASE_PROJECT_ID=mediscan-abc123`

---

### 📦 No Other External Setup Needed

| Task | Who does it | Status |
|---|---|---|
| Firebase project creation | **You** | ⬜ Pending |
| Download `google-services.json` | **You** | ⬜ Pending |
| Download Firebase service account JSON | **You** | ⬜ Pending |
| All code changes (backend + mobile) | **Me** | 🔨 Will do |
| SQLite stays as-is | — | ✅ No action needed |
| Pill images stored locally | — | ✅ No action needed |

---

## Verification Plan

### Phase 1 Milestones to Verify
1. Full add-medication flow: Scan → confirm → set schedule → saved
2. Today's schedule shows correct doses with correct status
3. Mark as Taken decrements pill count and logs correctly
4. Days remaining calculation is accurate
5. Restock flow adds pills and logs the restock event
6. Medication history shows all past logs

### Phase 2 Milestones
1. Push token registered on login
2. Notification fires at scheduled time
3. Low stock notification fires when threshold crossed
