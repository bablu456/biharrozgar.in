# Bihar Rozgar - FastAPI Backend 🚀

This document serves as the single source of truth for the **Bihar Rozgar** backend. It explains what this backend is, how it is structured, and how you can run and manage it.

---

## 1. 📖 Overview
Previously, this project relied heavily on Supabase for Authentication (Google/OTP) and direct database access from the frontend. **We have migrated away from Supabase.** 

This new backend is a **100% custom API** built using **FastAPI** (Python). 
- **Database:** PostgreSQL (running via Docker).
- **ORM:** SQLAlchemy (for database operations in Python).
- **Authentication:** Custom JWT (JSON Web Tokens) with Phone OTP.

By having our own backend, we have complete control over business logic, security, and data flow. The frontend (Next.js) now only talks to this FastAPI server, and *only* this FastAPI server talks to the database.

---

## 2. 🏗️ Architecture & Folder Structure

The code is organized using a clean architecture pattern inside the `backend/app` directory:

*   **`models/`**: Contains the SQLAlchemy database models. This defines exactly how tables look in PostgreSQL (e.g., `job.py`, `application.py`, `user.py`).
*   **`schemas/`**: Contains Pydantic models. These define the "shape" of the data going in and out of our API (e.g., what JSON fields a user must send to create a job).
*   **`crud/`** *(Create, Read, Update, Delete)*: Contains the database query logic. Whenever we need to fetch or save something to the database, we use a function from here (e.g., `crud_job.py`).
*   **`api/v1/endpoints/`**: Contains the actual API routes (URLs). For example, `jobs.py` handles requests to `/api/v1/jobs`. These routes call the `crud` functions to get data.
*   **`services/`**: Contains complex business logic that doesn't just belong to the database. For example, `auth.py` handles generating JWT tokens and verifying OTPs.
*   **`dependencies/`**: Reusable pieces of code injected into API routes. The most important one here is `auth.py`, which defines the `CurrentUser` dependency to ensure routes are protected.

---

## 3. 🔐 Authentication Flow (No More Supabase Auth)

Because we dropped Supabase Auth, authentication is handled by the FastAPI API:

1. **Detailed registration (`/auth/register`)**: Creates an account with full name, email, phone number, password, role, and district.
2. **Password login (`/auth/login`)**: Accepts an email address or phone number plus password.
3. **Email OTP login (`/auth/login/email/request-otp`)**: Sends a 6-digit OTP through SMTP, then verifies it with `/auth/login/email/verify-otp`.
4. **Phone OTP login (`/auth/login/phone/request-otp`)**: Creates a 6-digit phone OTP, then verifies it with `/auth/login/phone/verify-otp`.
5. **Frontend Integration**: The Next.js frontend saves the issued access and refresh tokens in `localStorage`.

In development, OTP codes are returned in the challenge response so local testing works without email or SMS credentials. Production email OTP requires the `SMTP_*` environment variables, and production phone OTP requires an SMS provider implementation in `app/services/otp_delivery.py`.

Direct social login is intentionally not part of the authentication system.

---

## 4. 🗄️ Database & Migrations

Your database is running locally via Docker Compose.

### Initialization Script
If you ever wipe your database and need to start fresh, you can run:
```bash
python -m app.db.init_db
```
This script will:
1. Create all necessary tables (`users`, `profiles`, `jobs`, `applications`, etc.).
2. Seed the database with all 38 districts of Bihar.
3. Seed the database with the default Job Categories.

### The Identity Cutover SQL (`sql/001_fastapi_identity_cutover.sql`)
Since we dropped Supabase Auth, the internal Supabase `auth.users` table is no longer used. We created our own `public.users` table. 
If you have existing data from the Supabase days, you run this SQL script directly in your database to copy existing `profiles` into the new `public.users` table so old users can still log in!

---

## 5. 🚀 How to Run the Backend

Follow these steps every time you want to start working:

**Step 1: Ensure the Database is running**
Make sure Docker Desktop is open, then start the PostgreSQL container:
```bash
docker compose up -d
```

**Step 2: Start the FastAPI Server**
Activate your virtual environment (if you are using one), navigate to the `backend` folder, and run:
```bash
uvicorn app.main:app --reload
```
*The `--reload` flag means the server will automatically restart whenever you save a Python file.*

**Step 3: Test the API**
FastAPI automatically generates beautiful interactive documentation.
Once the server is running, open your browser and go to:
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)**
Here, you can see all available endpoints, see what data they require, and even test them directly!

---

## 6. 📝 What You Need to Do Next

The heavy lifting of the migration is done. Both the Job Engine and User Dashboards are fully wired up. Your next focus areas should be:

1. **Application UI**: Currently, the frontend "Apply" buttons point to WhatsApp or external links. You need to build a React modal where seekers can type a cover letter and click "Apply" to hit the `/api/v1/applications/` endpoint internally.
2. **Real SMS Provider**: Open `backend/app/services/otp_delivery.py`. You'll see a placeholder function that just prints the OTP to the terminal. You need to integrate a real SMS provider (like Fast2SMS or Twilio) here to send real text messages to users in production.
