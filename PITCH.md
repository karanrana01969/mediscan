# 💊 MediScan — AI-Powered Medication Management Platform
### *Because No One Should Miss a Dose. Ever.*

---

> **"Every year, medication non-adherence causes 125,000 deaths and costs the healthcare system over $300 billion annually — just in the United States. MediScan is built to change that."**

---

## 📋 Table of Contents

1. [The Pitch](#the-pitch)
2. [Problem Statement](#problem-statement)
3. [Our Solution](#our-solution)
4. [How It Works — User Journey](#how-it-works)
5. [Core Features](#core-features)
6. [AI & Technology Stack](#technology-stack)
7. [Development Phases](#development-phases)
8. [Screen Map & Navigation Flow](#screen-map)
9. [Future Scope](#future-scope)
10. [Compliance & Global Readiness](#compliance)
11. [Business Model](#business-model)
12. [Why MediScan Wins](#why-mediscan-wins)

---

## 🎯 The Pitch {#the-pitch}

**MediScan** is an AI-powered mobile application that solves one of the most critical and overlooked problems in healthcare — **medication management for patients, the elderly, and their caregivers.**

When a patient walks out of a hospital, they often carry a bag full of prescriptions — multiple medications, complex schedules, unfamiliar names, and zero digital support. For an 70-year-old living alone, or a caregiver managing multiple patients, this is not just inconvenient — **it is dangerous.**

MediScan uses **Google Gemini AI** to instantly identify medications from a photo, set intelligent dose schedules, track adherence in real time, send timely push notifications, and give caregivers complete peace of mind — all in a single, beautifully designed mobile application.

**This is not just a reminder app. This is a complete medication lifecycle management system.**

---

## ❗ Problem Statement {#problem-statement}

### Problem 1 — Post-Discharge Medication Chaos

When a patient is discharged from the hospital, they receive a prescription with **multiple medications** — each with its own name, dosage, timing, and duration. The challenges are:

- **Complex schedules**: A patient may need to take 5–8 different medications at different times of day
- **Unfamiliar names**: Generic drug names are difficult to remember (e.g., "Metformin Hydrochloride 500mg")
- **No real-time tracking**: No system to verify whether the dose was actually taken
- **Caregiver burden**: Even with a helper at home — a family member, nurse, or caretaker — keeping track of every single medication for every patient is mentally exhausting and error-prone
- **Critical consequences**: A missed dose of blood pressure medication or insulin can lead to life-threatening complications, emergency re-admissions, and increased healthcare costs

### Problem 2 — The "Mystery Medicine" Problem

Every household has a medicine cabinet with pills and syrups lying around — **but nobody knows what they are for.** Patients often:

- Take a medication they've had for years without knowing its current relevance
- Accidentally take the wrong pill because they look similar
- Mix medications without knowing about dangerous drug interactions
- Throw away useful medication or keep expired medication out of uncertainty

**MediScan solves this with a simple camera scan** — point at any medicine box, label, or strip and the AI immediately tells you: what it is, what it treats, how it should be taken, and whether it conflicts with anything else you're already taking.

### Problem 3 — No Inventory Awareness

Patients frequently run out of critical medication because there is **no system warning them in advance**. Discovering you have 0 blood pressure pills on a Sunday night is a preventable crisis — yet it happens every day.

---

## ✅ Our Solution {#our-solution}

**MediScan** is a cross-platform mobile application (Android-first, iOS roadmap) that provides:

```
📷 AI Scan  →  📅 Smart Schedule  →  🔔 Real-time Alerts  →  📊 Adherence Reports  →  📦 Inventory Tracking
```

| Problem | MediScan Solution |
|---|---|
| Complex medication schedules | Visual daily timeline grouped by Morning / Afternoon / Evening / Night |
| Forgetting to take medication | Firebase push notifications with configurable reminders |
| Unknown medications at home | AI-powered scan using Google Gemini — instant identification |
| Drug interactions | Automatic interaction check before adding any new medication |
| Caregiver overload | Multi-profile support — one app, multiple patients |
| Running out of medication | Pill inventory tracker with low-stock alerts |
| No adherence visibility | Weekly/monthly adherence score with full history |

---

## 🚶 How It Works — User Journey {#how-it-works}

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MEDISCAN USER JOURNEY                           │
└─────────────────────────────────────────────────────────────────────────┘

  STEP 1: ONBOARDING
  ──────────────────
  Download App → Sign Up / Log In
        │
        ▼
  STEP 2: CREATE PATIENT PROFILE
  ───────────────────────────────
  Name + Age + Health Conditions + Allergies + Emergency Contact
        │
        ▼
  STEP 3: ADD MEDICATIONS  ◄────────────────────────────────────────┐
  ──────────────────────────                                         │
  Option A: 📷 Scan Medicine Box                                     │
            └→ AI identifies: Name, Dosage, Use, Side Effects       │
  Option B: ✏️  Manual Entry                                          │
            └→ Type name + details manually                         │
        │                                                            │
        ▼                                                            │
  ⚠️  AUTO DRUG INTERACTION CHECK                                    │
  (checks against all existing medications)                          │
        │                                                            │
        ▼                                                            │
  STEP 4: SET SCHEDULE                                               │
  ────────────────────                                               │
  Frequency: 1x / 2x / 3x per day                                   │
  Times: 08:00 AM, 02:00 PM, 08:00 PM                              │
  Days: Everyday / Mon-Fri / Custom                                 │
  Reminder: 5 / 10 / 15 / 30 mins before                          │
  Inventory: Total pills + Treatment duration                        │
        │                                                            │
        ▼                                                            │
  STEP 5: DAILY SCHEDULE VIEW (TODAY TAB)                           │
  ───────────────────────────────────────                           │
  🌅 Morning   → Metformin 500mg    [✓ Taken] [Skip]               │
  ☀️  Afternoon  → Aspirin 75mg      [⏰ Upcoming]                   │
  🌆 Evening   → Amlodipine 5mg     [⏰ Upcoming]                   │
  🌙 Night     → Pantoprazole 40mg  [⏰ Upcoming]                   │
        │                                                            │
        ▼                                                            │
  STEP 6: NOTIFICATIONS                                              │
  ──────────────────────                                             │
  🔔 "Time to take Metformin 500mg" (15 min before)                │
  ❌ "You missed your afternoon Aspirin dose"                       │
  ⚠️  "Only 5 days of Amlodipine left. Time to restock!"           │
        │                                                            │
        ▼                                                            │
  STEP 7: MEDICATION DETAIL & HISTORY                               │
  ────────────────────────────────────                              │
  📊 Adherence: 87% this month                                      │
  📦 Remaining: 14 pills (7 days left)  ← LOW STOCK ALERT         │
  📋 Full log: taken / missed / skipped per day                    │
  🔄 Restock → Add 30 pills → New count: 44                    ────┘
```

### Multi-Profile Caregiver Flow

```
  CAREGIVER ACCOUNT
        │
        ├── 👤 Profile: Grandma Rose (Age 72, Diabetes)
        │         └── 5 medications | 3 doses today | 87% adherence
        │
        ├── 👤 Profile: Dad (Age 65, Hypertension)
        │         └── 3 medications | 2 doses today | ⚠️ Low Stock
        │
        └── 👤 Profile: Uncle James (Age 58, Post-surgery)
                  └── 7 medications | 4 doses today | 92% adherence
```

---

## ⭐ Core Features {#core-features}

### 🤖 AI-Powered Medication Scanner
- Point camera at **any medicine box, strip, label, or bottle**
- Google Gemini Vision AI extracts and identifies:
  - Medicine name and generic name
  - Medical use / purpose (in simple, patient-friendly language)
  - Dosage instructions
  - Common side effects
  - Warnings
- **Works offline** for previously scanned medications

### 📅 Smart Scheduling Engine
- Set **multiple time slots** per medication per day
- **Preset frequencies**: Once / Twice / Three Times daily
- **Day selection**: Every day, weekdays only, or custom days
- **Configurable reminders**: 5, 10, 15, or 30 minutes before each dose
- **Time labels**: Morning / Afternoon / Evening / Night for easy reading

### 🔔 Firebase Push Notifications
- **Dose reminder**: Fires before each scheduled dose
- **Missed dose alert**: If dose is not marked within a time buffer
- **Low stock warning**: When remaining pills fall below a threshold
- **Restock reminder**: Predictive alert based on days of supply remaining
- Notifications **stop automatically on logout** (device token cleared)

### 📊 Adherence Analytics
- **Daily progress bar**: X / Y doses taken today
- **Weekly & Monthly adherence rate** (0–100%)
- **Color-coded score**: 🟢 Excellent / 🟡 Good / 🔴 Needs Attention
- **Full dose history**: Every taken, missed, skipped event with timestamp

### 📦 Pill Inventory Management
- Track **total pills** and **remaining count**
- Automatic decrement when dose is marked as taken
- **Days remaining** calculation based on schedule frequency
- **Low stock badge** when < 7 days of supply
- **Restock logging**: Track every refill with date and notes

### ⚠️ Drug Interaction Checker
- Runs **automatically when adding a new medication**
- Checks against all current medications in the profile
- Powered by Google Gemini AI
- Returns **plain-language warnings** — no medical jargon

### 👥 Multi-Profile Support
- One account, **multiple patient profiles**
- Each profile has: name, age, health conditions, allergies, emergency contact
- **Colour-coded avatars** for quick identification
- **Profile-level notifications** — alerts specific to each patient

### 💊 Pill Identification
- **Colour and shape tagging** for visual identification
- Helps elderly patients distinguish between similar-looking pills
- Reduces accidental wrong-medication intake

---

## 🛠️ Technology Stack {#technology-stack}

```
┌────────────────────────────────────────────────────────────────┐
│                     MEDISCAN TECH STACK                        │
├────────────────────────┬───────────────────────────────────────┤
│  Mobile App            │  React Native 0.86 + TypeScript       │
│  Navigation            │  React Navigation (Stack + Bottom Tab)│
│  State / Storage       │  AsyncStorage (local persistence)      │
│  Push Notifications    │  Firebase Cloud Messaging (FCM)       │
│  Camera / Image        │  react-native-image-picker            │
├────────────────────────┼───────────────────────────────────────┤
│  Backend API           │  FastAPI (Python)                     │
│  Database              │  SQLite → PostgreSQL (production)     │
│  AI / Vision           │  Google Gemini 1.5 Flash              │
│  Authentication        │  JWT (HS256, 30-day tokens)           │
│  Notifications         │  Firebase Admin SDK (server-side)     │
│  Background Jobs       │  APScheduler (cron-based)             │
├────────────────────────┼───────────────────────────────────────┤
│  Infrastructure        │  Render / Railway (API hosting)       │
│  Security              │  HTTPS, env-based secrets, .gitignore │
└────────────────────────┴───────────────────────────────────────┘
```

---

## 🗺️ Development Phases {#development-phases}

### ✅ Phase 1 — Core Foundation *(In Progress)*

**Goal**: Complete, functional medication management loop from scan to schedule to history.

| Feature | Status |
|---|---|
| User Auth (Signup / Login / Logout) | ✅ Complete |
| Multi-Patient Profile Management | ✅ Complete |
| AI Medication Scanner (Image + Text) | ✅ Complete |
| Add Medication (Manual Entry Form) | ✅ Complete |
| Drug Interaction Check | ✅ Complete |
| Smart Schedule Builder (time slots, days, labels) | ✅ Complete |
| Today's Dose Timeline View | ✅ Complete |
| Mark as Taken / Skipped | ✅ Complete |
| Pill Inventory Tracking (remaining pills, days left) | ✅ Complete |
| Medication Detail Screen (info + history + restock) | ✅ Complete |
| Adherence Analytics (7-day / 30-day) | ✅ Complete |
| Restock Logging | ✅ Complete |
| Firebase FCM Token Registration | ✅ Complete |
| Bottom Tab Navigation | ✅ Complete |
| Low Stock Detection API | ✅ Complete |

**Deliverable**: A fully usable app where a caregiver can onboard a patient, scan or add all their medications, set a complete schedule, and track daily adherence.

---

### 🔔 Phase 2 — Notifications & Automation *(Next Sprint)*

**Goal**: The app becomes proactive — it tells the patient what to do and when, without them needing to open the app.

| Feature | Status |
|---|---|
| Backend cron job (APScheduler, runs every minute) | 🔨 Planned |
| Dose reminder notification (N minutes before scheduled time) | 🔨 Planned |
| Missed dose alert (if not marked within buffer window) | 🔨 Planned |
| Low stock push notification (< threshold days remaining) | 🔨 Planned |
| Notification tap → deep-link to relevant medication | 🔨 Planned |
| Notification preferences per medication | 🔨 Planned |

**Deliverable**: Fully autonomous notification system. No manual app-checking required by the patient or caregiver.

---

### 📈 Phase 3 — Health Hub & Advanced Features *(Roadmap)*

**Goal**: Expand MediScan from a medication tracker to a complete health companion.

| Feature | Description |
|---|---|
| **Vitals Tracking** | Log blood pressure, heart rate, blood sugar over time |
| **Doctor Appointments** | Calendar view for upcoming appointments |
| **Adherence Reports** | Export PDF reports to share with doctors |
| **Emergency Contact Alert** | Notify emergency contact if multiple doses are missed |
| **Multi-language Support** | Hindi, Tamil, Spanish, Arabic and more |
| **Voice Input** | For elderly users who struggle to type |
| **Caregiver SMS Alerts** | Text message to caregiver if patient misses doses |

---

## 📱 Screen Map & Navigation Flow {#screen-map}

```
MEDISCAN — SCREEN ARCHITECTURE
═══════════════════════════════

  AUTH STACK
  ──────────
  Splash Screen
       │
       ├──► Login Screen ◄──── Signup Screen
       │         │
       ▼         ▼
  [Token stored in AsyncStorage]
       │
       ▼

  PROFILE SELECTION
  ─────────────────
  Profiles Screen (select patient)
       │
       ▼

  MAIN APP — BOTTOM TAB NAVIGATOR
  ────────────────────────────────
  ┌──────────────────────────────────────────────────────────┐
  │  💊 TODAY  │  📋 MEDICATIONS  │  📊 HISTORY  │  👤 PROFILE │
  └──────────────────────────────────────────────────────────┘
        │              │                │              │
        ▼              ▼                ▼              ▼
   Dashboard      Medications       History        Profile
   ─────────      ────────────      Screen         Management
   Today's         List Screen       ──────
   Doses           │                7-day /
   Timeline        ▼                30-day
   ─────────       Med Detail       adherence
   Mark Taken      Screen           score
   Mark Skip       ──────────
                   Full info
                   Log history
                   Restock

  PUSH SCREENS (accessible from multiple tabs)
  ─────────────────────────────────────────────
  📷 Scanner Screen → AI Analysis → Add Medication Screen
  📅 Set Schedule Screen
  🔄 Restock Modal
```

---

## 🚀 Future Scope {#future-scope}

### 🩺 Telemedicine Integration — In-App Doctor Consultation

**The Vision**: When a patient has a medication query or feels unwell, they should be able to connect with a certified doctor directly within MediScan — without switching apps.

**Features planned:**
- **Video / Audio consultation** with licensed doctors (on-demand)
- **Medication review sessions**: A doctor reviews the patient's current medication list and flags concerns
- **Chat with doctor**: For non-urgent queries (e.g., "Can I take this with food?")
- **Prescription generation**: Doctors can prescribe digitally within the app
- **Integration with medication list**: Doctor sees the patient's full medication history during the consultation

---

### 🛒 Intelligent Medication Purchase Assistant

**The Vision**: When a patient is running low on a medication, MediScan should automatically find the **best place to buy it** — saving time and money.

**Features planned:**
- **Local pharmacy finder**: Show nearby pharmacies with real-time stock availability
- **Price comparison**: Compare medication prices across online pharmacies (1mg, PharmEasy, Netmeds in India)
- **One-tap ordering**: Direct integration with pharmacy delivery APIs
- **Auto-reorder**: Set a minimum stock threshold — the app orders automatically
- **Generic alternatives**: Suggest bioequivalent generic versions at lower cost

---

### 🌍 Additional Future Features

| Feature | Description |
|---|---|
| **Wearable Integration** | Sync with smartwatches to track heart rate + medication timing |
| **Hospital EHR Integration** | Import prescriptions directly from hospital systems (FHIR standard) |
| **AI Health Coach** | Personalized daily health tips based on medication profile |
| **Family Sharing Dashboard** | Web portal for families to monitor multiple patients |
| **Regional Language Support** | Full localization for 20+ Indian languages and global markets |
| **Insurance Integration** | Track medication costs, generate insurance reimbursement reports |

---

## 🌐 Compliance & Global Readiness {#compliance}

For MediScan to be a credible, scalable, and trustworthy healthcare application — especially one that handles sensitive medical and personal data — it must comply with the following standards:

---

### 🇮🇳 India — Digital Health Compliance

| Regulation | Requirement | MediScan Plan |
|---|---|---|
| **DPDPA 2023** (Digital Personal Data Protection Act) | Consent before collecting personal/health data | Consent screen on signup; data minimization by design |
| **ABDM** (Ayushman Bharat Digital Mission) | Health ID linkage for interoperability | Phase 3: ABHA number integration |
| **CDSCO** (Central Drugs Standard Control Organisation) | Apps dispensing medical advice need classification | MediScan is a wellness/management tool — not a diagnostic device. Legal review required for telemedicine features. |
| **IT Act 2000 + Amendments** | Data security obligations | HTTPS-only API, encrypted storage, JWT auth |

---

### 🇺🇸 USA — Healthcare Compliance

| Regulation | Requirement | MediScan Plan |
|---|---|---|
| **HIPAA** (Health Insurance Portability and Accountability Act) | PHI (Protected Health Information) must be encrypted at rest and in transit | AES-256 encryption, HTTPS, audit logs planned |
| **FDA Digital Health** | Software as Medical Device (SaMD) classification | MediScan is a general wellness app — not FDA-regulated currently. Telemedicine features will require review. |
| **CCPA** (California Consumer Privacy Act) | Right to delete, right to know | Data deletion API + account deletion flow |

---

### 🇪🇺 European Union — Compliance

| Regulation | Requirement | MediScan Plan |
|---|---|---|
| **GDPR** (General Data Protection Regulation) | Explicit consent, data portability, right to erasure | Consent management, data export API, account deletion |
| **MDR** (Medical Device Regulation) | Clinical software classification | Wellness app classification — legal opinion needed for EU |
| **ePrivacy Directive** | Cookie consent & notification permissions | Already handled: FCM permission request at runtime |

---

### 🔒 Universal Security Standards

- **Authentication**: JWT with 30-day expiry + secure key rotation
- **API Security**: All endpoints authenticated; rate limiting planned
- **Data Encryption**: HTTPS (TLS 1.3) for all API communication
- **Secret Management**: All keys in `.env` files, never in source code
- **Push Notification Security**: FCM tokens tied to authenticated users; cleared on logout
- **Audit Trail**: All medication logs timestamped and immutable
- **Privacy by Design**: Minimum data collection; no third-party data selling

---

### 📋 Telemedicine-Specific Compliance (Phase 3)

When the telemedicine (doctor consultation) feature is introduced, MediScan will need:

- **Telemedicine Practice Guidelines, India (2020)**: Registered medical practitioners only; consent from patient; no prescriptions for certain drug categories via telemedicine
- **Data Localization**: Patient health data stored on Indian servers (for Indian users)
- **Doctor Verification**: Integration with Medical Council of India (MCI) registry for doctor credentialing

---

## 💼 Business Model {#business-model}

### Freemium + Subscription

MediScan offers a **free tier** that covers the core medication management need, with **premium tiers** unlocking advanced features.

---

### 🆓 Free Tier — Always Free

| Feature | Included |
|---|---|
| Medication AI Scanner | ✅ Up to 50 scans/month |
| Medication profiles | ✅ Up to 5 patient profile |
| Daily schedule + Mark Taken | ✅ Unlimited |
| Push notifications (dose reminders) | ✅ Basic reminders |
| Adherence history | ✅ Last 7 days |
| Drug interaction check | ✅ Up to 3/month |

---

### ⭐ MediScan Plus — ₹299 / month OR ₹2,499 / year (~₹208/month)

| Feature | Included |
|---|---|
| Unlimited AI scans | ✅ |
| Up to 5 patient profiles | ✅ |
| Full adherence history (unlimited) | ✅ |
| Advanced analytics & reports | ✅ |
| PDF report export | ✅ |
| Unlimited drug interaction checks | ✅ |
| Caregiver SMS alerts | ✅ |
| Priority customer support | ✅ |

---

### 💎 MediScan Pro — ₹799 / month OR ₹6,999 / year

| Feature | Included |
|---|---|
| Everything in Plus | ✅ |
| In-app doctor consultation (telemedicine) | ✅ 2 sessions/month |
| Medication purchase assistant | ✅ Price comparison + ordering |
| Hospital EHR integration (ABHA / FHIR) | ✅ |
| Vitals tracking & correlation | ✅ |
| Family dashboard (web portal) | ✅ |
| Dedicated account manager | ✅ |

---

### 🏥 Enterprise / Hospital Tier — Custom Pricing

- Bulk licensing for hospitals, nursing homes, elderly care facilities
- White-label version available
- API access for integration with hospital management systems
- Patient discharge workflow integration
- Analytics dashboard for healthcare administrators

---

### 💰 Revenue Projections (Year 1 Target)

| Segment | Estimate |
|---|---|
| Free users | 50,000 |
| Plus subscribers (5% conversion) | 2,500 × ₹2,499 = **₹62.5 L/year** |
| Pro subscribers (1% conversion) | 500 × ₹6,999 = **₹35 L/year** |
| Enterprise pilots | 5 × ₹2L = **₹10 L/year** |
| **Total Year 1** | **~₹1.07 Cr** |

---

## 🏆 Why MediScan Wins {#why-mediscan-wins}

### The Competitive Edge

| Competitor | Gap | MediScan Advantage |
|---|---|---|
| Generic reminder apps | No AI, no interaction check, no inventory | Full AI + interaction + inventory in one app |
| Hospital apps | Only for one hospital, no home use | Universal — works for any medication, any source |
| Pharmacy apps | Focus on purchase, not adherence | Full lifecycle: scan → schedule → track → restock |
| Paper prescriptions | Easily lost, no alerts | Digital, searchable, with proactive notifications |

### Our Unique Differentiators

1. **🤖 AI-First**: Google Gemini identifies any medication from a photo in seconds — no database lookup, no barcode needed
2. **👥 Caregiver-Centric**: Built for the person managing care, not just the patient
3. **🌐 India-First**: Designed for the Indian healthcare context — complex multi-drug regimens, elderly patients, low digital literacy
4. **🔔 Proactive, not Reactive**: The app tells YOU what to do — not the other way around
5. **📊 Data-Driven**: Adherence analytics that are actually useful to doctors and families
6. **🔒 Privacy-First**: Built with compliance in mind from day one

---

## 👨‍💻 Team & Current Progress

| Milestone | Status |
|---|---|
| Backend API (FastAPI + SQLite) | ✅ Complete |
| AI Medication Scanner | ✅ Complete |
| Mobile App (React Native + TypeScript) | ✅ Complete |
| Bottom Tab Navigation | ✅ Complete |
| Full Scheduling System | ✅ Complete |
| Adherence Analytics | ✅ Complete |
| Firebase Push Notification Setup | ✅ Complete |
| Deployed & Running (ngrok / Render) | ✅ Running |
| Phase 2 (Auto Notifications) | 🔨 Next Sprint |
| App Store Submission | 📅 Q3 2025 |

---

*Document prepared for internal review and competition submission.*
*MediScan — Built with ❤️ for patients who deserve better.*
