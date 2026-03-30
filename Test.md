# 🧪 Expense Tracker — Comprehensive Test Documentation

> **Version:** Phase 1 (Weeks 1–2 Implemented)  
> **Last Updated:** 2026-03-24  
> **Tech Stack:** Angular 20 · Java 21 · Spring Boot 3 · MongoDB · JWT  
> **Base URLs:**  
> - Frontend: `http://localhost:4200`  
> - Backend API: `http://localhost:8080/api/v1`  
> - Swagger UI: `http://localhost:8080/swagger-ui.html`  
> - MongoDB: `mongodb://localhost:27017/expense_tracker`

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Environment Setup](#2-environment-setup)
3. [Feature Summary](#3-feature-summary)
4. [Detailed Feature Breakdown](#4-detailed-feature-breakdown)
5. [UI Testing Guide](#5-ui-testing-guide)
6. [Backend / API Testing](#6-backend--api-testing)
7. [Database Validation](#7-database-validation)
8. [Postman Testing Guide](#8-postman-testing-guide)
9. [Test Scenarios & Test Cases](#9-test-scenarios--test-cases)
10. [Known Issues & Limitations](#10-known-issues--limitations)

---

## 1. Project Overview

**Expense Tracker** is an AI-powered personal finance companion for young Indian professionals (18–30 age range). It automatically ingests financial transactions from SMS messages, email alerts, and bank statements, then provides analytics, budgeting, goal tracking, and AI-driven insights.

### Current Development Status

| Phase | Week | Feature | Status |
|-------|------|---------|--------|
| Phase 1 | Week 1 | Authentication System (Register / Login / JWT / Refresh) | ✅ Implemented |
| Phase 1 | Week 1 | Route Guards & JWT Interceptor | ✅ Implemented |
| Phase 1 | Week 1 | Navbar & Sidebar (Shell) | ✅ Implemented |
| Phase 1 | Week 1 | Dashboard Shell | ✅ Implemented |
| Phase 1 | Week 2 | SMS Import & Bulk Parsing (Regex + AI Fallback) | ✅ Implemented |
| Phase 1 | Week 2 | Data Ingestion Hub | ✅ Implemented |
| Phase 1 | Week 2 | Ingestion Log Viewer | ✅ Implemented |
| Phase 1 | Week 3 | Email Connect Screen (IMAP + Gmail stub) | ✅ Implemented |
| Phase 1 | Week 3 | Email Parser Service (Backend) | ✅ Implemented |
| Phase 1 | Week 3 | Email Endpoints (connect / sync / status / disconnect) | ✅ Implemented |
| Phase 1 | Week 3 | Gmail OAuth Connect | ⚠️ Stubbed (Google Cloud not configured) |
| Phase 2–4 | Weeks 4–16 | Bank Statement Upload, Transactions, Goals, Budgets, Investments, Analytics, AI | 🔲 Not Yet Built |

---

## 2. Environment Setup

### 2.1 Prerequisites

| Tool | Required Version | Verify Command |
|------|-----------------|----------------|
| Node.js | 22.x LTS | `node -v` |
| Angular CLI | 20.x | `ng version` |
| Java | 21 (LTS) | `java -version` |
| Maven | 3.9+ | `mvn -v` |
| MongoDB | 7.x | `mongod --version` |

### 2.2 Starting the Stack

**1. MongoDB**
```bash
# Windows Service
net start MongoDB

# OR Docker
docker run -d --name expense-mongo -p 27017:27017 mongo:7
```

**2. Backend (Spring Boot)**
```bash
cd backend
./mvnw spring-boot:run
# Starts on http://localhost:8080
```

**3. Frontend (Angular)**
```bash
cd frontend
ng serve
# Opens http://localhost:4200
```

### 2.3 Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Primary Test User | `sparshhanda2002@gmail.com` | `Sparsh@05` |
| Secondary Test User | `test@example.com` | `Test@1234` |

> **Note:** Register a new user if none exist. Registration is open via `http://localhost:4200/register`.

---

## 3. Feature Summary

| # | Feature | Description |
|---|---------|-------------|
| F-01 | User Registration | Create account with email, password, name, age, monthly income |
| F-02 | User Login | Authenticate with JWT access + refresh tokens |
| F-03 | Token Refresh | Auto-renew access token using refresh token |
| F-04 | Route Guard | Redirect unauthenticated users to `/login` |
| F-05 | JWT Interceptor | Attach Bearer token to all API requests automatically |
| F-06 | Dashboard Shell | Protected landing page post-login |
| F-07 | Data Ingestion Hub | Central hub with SMS, Email, and Bank Statement import options |
| F-08 | SMS Import | Paste raw bank/UPI SMS → auto-parse transactions with confidence scores |
| F-09 | Email Connect (IMAP) | Connect personal email via IMAP to scan transaction alert emails |
| F-10 | Gmail Connect | Google OAuth flow for Gmail scanning (stubbed — Google Cloud not configured) |
| F-11 | Email Sync | Trigger inbox scan to detect transaction emails |
| F-12 | Email Disconnect | Remove linked email provider |
| F-13 | Ingestion Log | Paginated audit log of all past ingestion attempts |
| F-14 | Logout | Clear session, redirect to login |

---

## 4. Detailed Feature Breakdown

---

### F-01 — User Registration

**Description:** New users create an account by providing personal and financial details.

**User Flow:**
1. Navigate to `http://localhost:4200/register`
2. Fill in: Full Name, Email, Password, Age, Monthly Income
3. Click **Create Account**
4. On success → redirect to `/dashboard`

**Expected Behavior:**
- Passwords are BCrypt-hashed (strength 12) before storage
- Duplicate email returns a 409 Conflict error
- JWT access token (15 min) and refresh token (7 days) are returned
- User data is saved to MongoDB `users` collection
- Frontend stores tokens in `localStorage` under keys `access_token`, `refresh_token`, `current_user`

**Validation Rules:**
| Field | Rule |
|-------|------|
| Email | Valid email format, unique |
| Password | Min 8 characters |
| Full Name | Required |
| Age | Required, number |
| Monthly Income | Required, number |

**Edge Cases:**
- Duplicate email → show error toast "Email already registered"
- Network failure → show generic error toast
- Password < 8 chars → form is invalid, button stays disabled

---

### F-02 — User Login

**Description:** Existing users authenticate with email and password.

**User Flow:**
1. Navigate to `http://localhost:4200/login`
2. Enter email + password
3. Click **Sign In**
4. On success → redirect to `/dashboard`

**Expected Behavior:**
- Backend returns `{ success: true, data: { accessToken, refreshToken, userId, mail, fullName } }`
- Frontend unwraps the `data` envelope via `mapToAuthResponse()`
- Tokens stored in `localStorage`; user signal updated
- Failed login shows error toast

**Edge Cases:**
- Wrong password → 401 → "Invalid credentials" toast
- Non-existent email → 401 → error toast
- Empty fields → form validation prevents submission

---

### F-03 — Token Refresh

**Description:** Silently renews an expired access token using the stored refresh token.

**User Flow:** Triggered automatically by the JWT interceptor when a 401 response is received.

**Expected Behavior:**
- Calls `POST /api/v1/auth/refresh` with `{ refreshToken: "..." }`
- On success: replaces `access_token` in localStorage, retries the original request
- On failure (refresh token expired): logs user out, redirects to `/login`

---

### F-04 — Route Guard

**Description:** Protects all non-auth routes from unauthenticated access.

**Expected Behavior:**
- Any navigation to `/dashboard`, `/ingest/**` without a valid session redirects to `/login`
- On direct browser URL access, the guard checks `isAuthenticated()` signal (reads from localStorage)

---

### F-05 — JWT Interceptor

**Description:** Automatically attaches the `Authorization: Bearer <token>` header to all HTTP requests.

**Expected Behavior:**
- Every API call made from the frontend includes the current access token
- On 401 response, triggers a token refresh flow before retrying

---

### F-06 — Dashboard Shell

**Description:** The main landing page after login. Currently a placeholder for future widgets (Phase 1 Week 6+).

**User Flow:**
1. Login → auto-redirect to `/dashboard`
2. See the sidebar with navigation links and top navbar with user avatar
3. Main area shows "Dashboard Shell" placeholder text

---

### F-07 — Data Ingestion Hub

**Description:** A central page at `/ingest` with cards for each import method.

**User Flow:**
1. Click **Import Data** in the sidebar → navigate to `/ingest`
2. Three cards shown: SMS Import, Email Connect, Bank Statement (Coming Soon)
3. Three sub-tabs at the top: SMS Import / Email Connect / Ingestion Log
4. Click any card or tab to open the corresponding child route

---

### F-08 — SMS Import

**Description:** Users paste raw bank/UPI SMS messages; the backend parses them and returns structured transaction previews.

**User Flow:**
1. Navigate to `/ingest/sms`
2. Paste one or more raw SMS messages (one per line)
3. Click **Parse SMS**
4. View parsed transaction table with: Merchant, Amount, Date, UPI Platform, Confidence Score
5. Select transactions to import (all selected by default)
6. Click **Import Selected** or **Import All**

**Expected Behavior:**
- `POST /api/v1/ingest/sms/bulk` receives `{ smsTexts: ["sms1", "sms2"] }`
- Backend returns `{ success, data: { parsedCount, duplicateCount, failedCount, transactions: [...] } }`
- Frontend unwraps `data` envelope before mapping
- Confidence shown as colour-coded pill: 🟢 High (≥90%), 🟡 Medium (≥70%), 🔴 Low (<70%)
- Duplicate SMS → counted in `duplicateCount`, not shown in preview table
- Clear button resets form and results

**Sample Test SMS Messages:**
```
INR 6720 debited
A/c no. XXXXXX47845
23-03-26, 23:52:42
UPI/P2A/402832007488/BUDIMUDI SRINIVASA
Not you? SMS BLOCKUPI Cust ID to 01600180002
Axis Bank.

Rs.250.00 debited from SBI A/c X1234 on 23Mar26 to SWIGGY REF NO 407234512345.

INR 1500.00 transferred to HDFC a/c XXXX1234 via PhonePe. UPI Ref: 301234567890
```

---

### F-09 — Email Connect (IMAP)

**Description:** Connect a personal email inbox via IMAP to auto-scan for transaction alert emails.

**User Flow:**
1. Navigate to `/ingest/email`
2. Click **Connect via IMAP** card → expand IMAP form
3. Enter: IMAP Host, Port, Email, Password, SSL toggle
4. Click **Connect**
5. On success → shows connected status badge
6. Click **Sync Now** to scan inbox for transactions
7. Review detected transaction emails in table
8. Import selected emails

**Expected Behavior:**
- `POST /api/v1/ingest/email/connect` with provider = `IMAP` and credentials
- `POST /api/v1/ingest/email/sync` triggers inbox scan
- `GET /api/v1/ingest/email/status` fetches current connection state on component load
- `DELETE /api/v1/ingest/email/connect` disconnects the provider

**Common IMAP Settings:**
| Provider | Host | Port | SSL |
|----------|------|------|-----|
| Gmail | `imap.gmail.com` | 993 | ✅ |
| Outlook | `outlook.office365.com` | 993 | ✅ |
| Yahoo | `imap.mail.yahoo.com` | 993 | ✅ |

---

### F-10 — Gmail OAuth Connect

**Description:** One-click Gmail connection via Google OAuth. **(Currently stubbed.)**

**Current Behavior:** Clicking "Sign In with Google" shows a warning toast: *"Google OAuth integration is not yet configured. Use IMAP credentials for now."*

**No backend call is made.** This prevents the previous 500 error from a fake auth code being sent.

---

### F-11 — Ingestion Log

**Description:** Paginated audit trail of every ingestion attempt (SMS, email, bank statement).

**User Flow:**
1. Navigate to `/ingest/log`
2. View table: Source, Raw Text, Status, Confidence, Date
3. Paginate through results

**Expected Behavior:**
- `GET /api/v1/ingest/log?page=0&size=10` returns paginated log entries
- Status badges: ✅ SUCCESS, ❌ FAILED, 🔁 DUPLICATE, 🔍 PENDING_REVIEW

---

### F-12 — Logout

**Description:** Clears session data and redirects to login.

**User Flow:**
1. Click user avatar in navbar → dropdown menu
2. Click **Logout**
3. `localStorage` cleared (`access_token`, `refresh_token`, `current_user`)
4. Redirected to `/login`

---

## 5. UI Testing Guide

### 5.1 General Setup

1. Open `http://localhost:4200` in Chrome/Edge
2. Open DevTools (F12) → **Console** tab to watch for errors
3. Open **Network** tab to monitor API calls
4. Clear browser cache + hard refresh (`Ctrl+Shift+R`) before each session

### 5.2 Auth Flow Test Checklist

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Open `http://localhost:4200` | Redirect to `/login` |
| 2 | Click "Create one free" | Navigate to `/register` |
| 3 | Fill Register form with valid data | Account created, redirect to `/dashboard` |
| 4 | Inspect localStorage in DevTools → Application | `access_token`, `refresh_token`, `current_user` keys present |
| 5 | Click Logout | Redirect to `/login`, localStorage cleared |
| 6 | Try navigating to `/dashboard` directly | Redirect back to `/login` |
| 7 | Login with registered credentials | Redirect to `/dashboard` |
| 8 | Attempt login with wrong password | Error toast: "Invalid credentials" |

### 5.3 SMS Import Test Checklist

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/ingest/sms` | SMS Import screen shown |
| 2 | Leave textarea empty, click Parse SMS | Button disabled (no input) |
| 3 | Paste 1+ sample SMS messages | Textarea accepts input |
| 4 | Click Parse SMS | Loading spinner shown, API called |
| 5 | Review results table | Merchant, Amount, Date, Confidence visible |
| 6 | Verify confidence colour codes | High=green, Medium=yellow, Low=red |
| 7 | Uncheck some rows, click Import Selected | Only checked rows imported |
| 8 | Click Clear | Textarea and table reset |
| 9 | Paste duplicate SMS already imported | Duplicate count incremented, not shown in table |

### 5.4 Email Connect Test Checklist

| Step | Action | Expected Result |
|------|--------|----------------|
| 1 | Navigate to `/ingest/email` | Email Connect page shown with connection status |
| 2 | Click "Sign In with Google" | Warning toast: "Coming Soon / use IMAP" |
| 3 | Click "Connect via IMAP" | IMAP credential form expands |
| 4 | Submit IMAP form with empty fields | Connect button disabled |
| 5 | Submit valid IMAP credentials | API called, status updated on success |
| 6 | Click "Sync Now" (when connected) | Inbox scan triggered |
| 7 | Click Disconnect | Connection cleared, status reset |

### 5.5 Navigation Test Checklist

| Route | Authenticated Required | Expected Result |
|-------|----------------------|----------------|
| `/` | No | Redirect to `/dashboard` |
| `/login` | No | Login page shown |
| `/register` | No | Register page shown |
| `/dashboard` | **Yes** | Dashboard shell shown OR redirect to `/login` |
| `/ingest` | **Yes** | Redirect to `/ingest/sms` |
| `/ingest/sms` | **Yes** | SMS Import screen |
| `/ingest/email` | **Yes** | Email Connect screen |
| `/ingest/log` | **Yes** | Ingestion Log screen |
| `/anything-else` | No | Redirect to `/dashboard` (wildcard) |

---

## 6. Backend / API Testing

### 6.1 Authentication Endpoints

#### `POST /api/v1/auth/register`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "Test@1234",
  "fullName": "Test User",
  "age": 24,
  "monthlyIncome": 50000
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "userId": "abc123",
    "mail": "test@example.com",
    "fullName": "Test User"
  }
}
```

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| Duplicate email | 409 | "Email already exists" |
| Invalid email format | 400 | Validation error |
| Password too short | 400 | Validation error |
| Missing required fields | 400 | Validation error |

---

#### `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "test@example.com",
  "password": "Test@1234"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "login successful",
  "data": {
    "accessToken": "<jwt>",
    "refreshToken": "<jwt>",
    "userId": "abc123",
    "mail": "test@example.com",
    "fullName": "Test User"
  }
}
```

**Error Responses:**

| Scenario | Status | Message |
|----------|--------|---------|
| Wrong password | 401 | "Invalid credentials" |
| Unknown email | 401 | "Invalid credentials" |
| Missing fields | 400 | Validation error |

---

#### `POST /api/v1/auth/refresh`

**Request:**
```json
{
  "refreshToken": "<refresh-jwt>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "<new-jwt>",
    "refreshToken": "<new-refresh-jwt>"
  }
}
```

---

### 6.2 Ingestion Endpoints

> All ingestion endpoints require `Authorization: Bearer <accessToken>` header.

#### `POST /api/v1/ingest/sms/bulk`

**Request:**
```json
{
  "smsTexts": [
    "INR 6720 debited A/c no. XXXXXX47845 23-03-26, UPI/P2A/402832007488/BUDIMUDI SRINIVASA Axis Bank.",
    "Rs.250.00 debited from SBI A/c X1234 on 23Mar26 to SWIGGY REF NO 407234512345."
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "parsedCount": 2,
    "duplicateCount": 0,
    "failedCount": 0,
    "transactions": [
      {
        "merchant": "BUDIMUDI SRINIVASA",
        "amount": 6720.00,
        "date": "2026-03-23",
        "currency": "INR",
        "upiPlatform": "UPI",
        "referenceNumber": "402832007488",
        "parsingConfidence": 0.92,
        "rawText": "INR 6720 debited..."
      }
    ]
  }
}
```

---

#### `GET /api/v1/ingest/log?page=0&size=10`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "xyz",
        "source": "SMS",
        "rawText": "INR 6720...",
        "status": "SUCCESS",
        "parsingConfidence": 0.92,
        "createdAt": "2026-03-23T23:52:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "number": 0,
    "size": 10
  }
}
```

---

#### `POST /api/v1/ingest/email/connect`

**Request (IMAP):**
```json
{
  "provider": "IMAP",
  "host": "imap.gmail.com",
  "port": 993,
  "email": "user@gmail.com",
  "password": "app-password",
  "ssl": true
}
```

---

#### `GET /api/v1/ingest/email/status`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "connected": false,
    "provider": null,
    "email": null,
    "lastSyncAt": null,
    "syncedCount": 0,
    "syncStatus": "DISCONNECTED",
    "errorMessage": null
  }
}
```

---

#### `POST /api/v1/ingest/email/sync`

Triggers an inbox scan. Returns email scan results.

#### `DELETE /api/v1/ingest/email/connect`

Disconnects the linked email provider.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email provider disconnected"
}
```

---

### 6.3 Week 3 — Additional Email Endpoint Notes

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|--------------|--------|
| `/api/v1/ingest/email/connect` | POST | ✅ | Connect Gmail (OAuth) or IMAP |
| `/api/v1/ingest/email/sync` | POST | ✅ | Trigger inbox scan for transaction emails |
| `/api/v1/ingest/email/status` | GET | ✅ | Fetch current connection status |
| `/api/v1/ingest/email/connect` | DELETE | ✅ | Disconnect linked email provider |

**Known sender addresses scanned during email sync:**
```
alerts@hdfcbank.net
transaction@icicibank.com
noreply@sbi.co.in
alerts@axisbank.com
```

---

## 7. Database Validation

### 7.1 MongoDB Collections

| Collection | Purpose |
|------------|---------|
| `users` | Registered user accounts |
| `transactions` | Parsed financial transactions |
| `raw_ingestion_log` | Audit log of every ingestion attempt |

### 7.2 Sample Validation Queries (run in `mongosh` or MongoDB Compass)

**Check if user was created after registration:**
```javascript
use expense_tracker
db.users.findOne({ email: "test@example.com" })
// Expected: document with hashed password, fullName, age, monthlyIncome, createdAt
```

**Check password is hashed (not plain text):**
```javascript
db.users.findOne({ email: "test@example.com" }, { passwordHash: 1 })
// Expected: passwordHash starts with "$2a$" (BCrypt prefix)
```

**Check ingestion log after SMS parse:**
```javascript
db.raw_ingestion_log.find({ source: "SMS" }).sort({ createdAt: -1 }).limit(5)
// Expected: documents with rawContent, parsedFields, parsingStatus, parsingConfidence
```

**Check transaction record was created:**
```javascript
db.transactions.find({}).sort({ createdAt: -1 }).limit(5)
// Expected: transactions with merchant, amount, date, source="SMS", userId
```

**Verify deduplication (same SMS submitted twice):**
```javascript
// After submitting same SMS twice, count should be 1
db.raw_ingestion_log.countDocuments({ rawContent: "<exact-sms-text>" })
// Expected: 1 (second submission was flagged as duplicate)
```

**Check indexes exist:**
```javascript
db.users.getIndexes()
db.transactions.getIndexes()
db.raw_ingestion_log.getIndexes()
```

---

## 8. Postman Testing Guide

### 8.1 Collection Setup

Create a new Collection called **"Expense Tracker API"**.

Add the following Collection Variables:

| Variable | Value |
|----------|-------|
| `baseUrl` | `http://localhost:8080/api/v1` |
| `accessToken` | *(auto-set by login test script)* |
| `refreshToken` | *(auto-set by login test script)* |
| `userEmail` | `test@example.com` |
| `userPassword` | `Test@1234` |

### 8.2 Authentication Setup

In the **Login** request, add this to the **Tests** tab to auto-save tokens:

```javascript
const res = pm.response.json();
if (res.success && res.data) {
    pm.collectionVariables.set("accessToken", res.data.accessToken);
    pm.collectionVariables.set("refreshToken", res.data.refreshToken);
    console.log("Tokens saved ✅");
}
```

For all protected requests, set **Authorization** → Type: **Bearer Token** → Value: `{{accessToken}}`.

### 8.3 Request Examples

**Register User:**
```
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
    "email": "{{userEmail}}",
    "password": "{{userPassword}}",
    "fullName": "QA Tester",
    "age": 25,
    "monthlyIncome": 60000
}
```

**Login:**
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
    "email": "{{userEmail}}",
    "password": "{{userPassword}}"
}
```

**Parse SMS (Bulk):**
```
POST {{baseUrl}}/ingest/sms/bulk
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
    "smsTexts": [
        "INR 6720 debited A/c no. XXXXXX47845 23-03-26 UPI/P2A/402832007488/BUDIMUDI SRINIVASA Axis Bank.",
        "Rs.250.00 debited from SBI A/c X1234 on 23Mar26 to SWIGGY REF NO 407234"
    ]
}
```

**Get Ingestion Log:**
```
GET {{baseUrl}}/ingest/log?page=0&size=10
Authorization: Bearer {{accessToken}}
```

**Refresh Token:**
```
POST {{baseUrl}}/auth/refresh
Content-Type: application/json

{
    "refreshToken": "{{refreshToken}}"
}
```

---

## 9. Test Scenarios & Test Cases

### 9.1 Authentication Test Cases

| ID | Test Case | Input | Expected Result | Pass/Fail |
|----|-----------|-------|----------------|-----------|
| TC-A01 | Register with valid data | Valid email, password ≥8 chars | 200, tokens returned, user in DB | ⬜ |
| TC-A02 | Register with duplicate email | Existing email | 409 Conflict, error message | ⬜ |
| TC-A03 | Register with invalid email format | `notanemail` | 400 validation error | ⬜ |
| TC-A04 | Register with short password | 5-char password | 400 validation error | ⬜ |
| TC-A05 | Register with missing fields | Omit `fullName` | 400 validation error | ⬜ |
| TC-A06 | Login with correct credentials | Valid email + password | 200, access + refresh tokens | ⬜ |
| TC-A07 | Login with wrong password | Valid email, wrong password | 401 Unauthorized | ⬜ |
| TC-A08 | Login with non-existent email | Unknown email | 401 Unauthorized | ⬜ |
| TC-A09 | Access protected route with valid token | Valid `Authorization` header | 200 OK | ⬜ |
| TC-A10 | Access protected route with expired token | Expired token | 401 + auto-refresh triggered | ⬜ |
| TC-A11 | Access protected route with no token | No header | 401 Unauthorized | ⬜ |
| TC-A12 | Refresh token with valid refresh JWT | Valid refresh token | 200, new access token | ⬜ |
| TC-A13 | Refresh token with expired refresh JWT | Expired refresh token | 401, user logged out | ⬜ |

### 9.2 SMS Ingestion Test Cases

| ID | Test Case | Input | Expected Result | Pass/Fail |
|----|-----------|-------|----------------|-----------|
| TC-S01 | Parse single valid SBI SMS | SBI debit SMS text | parsedCount=1, merchant/amount/date populated | ⬜ |
| TC-S02 | Parse single valid HDFC SMS | HDFC debit SMS text | parsedCount=1, high confidence | ⬜ |
| TC-S03 | Parse UPI/GPay SMS | GPay UPI SMS | upiPlatform populated | ⬜ |
| TC-S04 | Parse Axis Bank SMS (sample provided) | INR 6720 debit SMS | parsedCount=1, amount=6720 | ⬜ |
| TC-S05 | Parse multiple SMS at once | 3 valid SMS messages | parsedCount=3, all displayed | ⬜ |
| TC-S06 | Submit duplicate SMS | Same SMS submitted twice | Second → duplicateCount=1, not in table | ⬜ |
| TC-S07 | Submit completely garbled text | Random characters | failedCount=1 OR low confidence | ⬜ |
| TC-S08 | Submit empty smsTexts array | `[]` | 400 Bad Request | ⬜ |
| TC-S09 | Submit without auth token | No Bearer header | 401 Unauthorized | ⬜ |
| TC-S10 | Mix of valid + invalid SMS | 2 valid, 1 garbled | parsedCount=2, failedCount=1 | ⬜ |
| TC-S11 | Confidence colour coding | Low confidence transaction | Red badge shown in UI | ⬜ |
| TC-S12 | Select/deselect rows | Uncheck 1 row, import | Only checked rows imported | ⬜ |
| TC-S13 | Toggle All checkbox | Check/uncheck all | All rows selected/deselected | ⬜ |
| TC-S14 | Clear button | After parsing | Textarea + table reset | ⬜ |

### 9.3 Email Connect Test Cases

| ID | Test Case | Input | Expected Result | Pass/Fail |
|----|-----------|-------|----------------|-----------|
| TC-E01 | Email status on page load | GET /email/status | Status card shows DISCONNECTED | ⬜ |
| TC-E02 | Click Sign In with Google | Button click | Warning toast shown, NO API call | ⬜ |
| TC-E03 | Connect with invalid IMAP creds | Wrong host/password | 500 or 4xx error toast | ⬜ |
| TC-E04 | Connect with valid IMAP creds | Correct IMAP settings | Status shows CONNECTED | ⬜ |
| TC-E05 | Sync email (when connected) | Click Sync Now | Scan triggered, emails listed | ⬜ |
| TC-E06 | Disconnect email | Click Disconnect | Status reset to DISCONNECTED | ⬜ |
| TC-E07 | IMAP form validation — empty host | Submit without host | Connect button disabled | ⬜ |
| TC-E08 | Email status persists after page reload | Reload `/ingest/email` | Status card shows same connected/disconnected state | ⬜ |
| TC-E09 | Disconnect clears scan results | Disconnect → check UI | Detected emails table removed, status reset | ⬜ |
| TC-E10 | Sync with no transaction emails | Connected mailbox with no alerts | `transactionEmailsFound: 0`, empty table | ⬜ |
| TC-E11 | Toggle select/deselect email rows | Check/uncheck rows | Import Selected respects selection | ⬜ |

### 9.4 Navigation & Guard Test Cases

| ID | Test Case | Expected Result | Pass/Fail |
|----|-----------|----------------|-----------|
| TC-N01 | Visit `/` without login | Redirect to `/login` | ⬜ |
| TC-N02 | Visit `/dashboard` without login | Redirect to `/login` | ⬜ |
| TC-N03 | Visit `/ingest/sms` without login | Redirect to `/login` | ⬜ |
| TC-N04 | Visit `/ingest` when logged in | Redirect to `/ingest/sms` | ⬜ |
| TC-N05 | Visit `/unknown-route` | Redirect to `/dashboard` | ⬜ |
| TC-N06 | Sidebar navigation works | Click each link | Correct route loaded | ⬜ |
| TC-N07 | Logout clears localStorage | After logout | `access_token` key gone | ⬜ |
| TC-N08 | Back button after logout | Press back | Cannot access protected route | ⬜ |

### 9.5 Boundary Conditions

| ID | Boundary Case | Expected Result | Pass/Fail |
|----|---------------|----------------|-----------|
| TC-B01 | Age = 0 in register | 400 validation error | ⬜ |
| TC-B02 | Monthly income = 0 | Registration allowed | ⬜ |
| TC-B03 | SMS text > 1000 characters | Parsed or gracefully failed | ⬜ |
| TC-B04 | 100 SMS in one bulk request | All processed, no timeout | ⬜ |
| TC-B05 | Ingestion log page=999 (out of range) | Empty content array | ⬜ |
| TC-B06 | JWT tampered/invalid | 401 Unauthorized | ⬜ |

---

## 10. Known Issues & Limitations

| # | Issue | Severity | Workaround |
|---|-------|----------|-----------|
| KI-01 | Gmail OAuth ("Sign In with Google") not configured | Medium | Use IMAP credentials instead. Button shows "Coming Soon" toast. |
| KI-02 | Dashboard shows only placeholder content | Low | Expected — widgets planned for Week 6 |
| KI-03 | Stale service worker may call `backend.spendingcalculator.xyz` | Low | DevTools → Application → Service Workers → Unregister, hard refresh |
| KI-04 | Backend response envelope `{ success, data }` unwrapped in frontend | Info | Fixed in `auth.service.ts` and `ingestion.service.ts` |
| KI-05 | Email IMAP connect returns 500 for bad credentials | Medium | Backend error — error toast is shown to user |
| KI-06 | Bank Statement upload not yet implemented | High | Planned for Week 4 — "Coming Soon" badge shown |
| KI-07 | Transactions, Goals, Budgets, Investments, Analytics, AI not yet built | High | Planned for Phases 2–4 (Weeks 4–16) |
| KI-08 | No rate limiting enforced on auth endpoints in dev | Low | Bucket4j dependency present but not yet wired |

---

*Generated by QA Documentation Suite — Expense Tracker Project*
