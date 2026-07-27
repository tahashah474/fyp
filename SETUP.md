# MalShifa — Complete Setup Guide

This guide explains how to set up and run **MalShifa** locally.

---

# Project Overview

MalShifa is an AI-powered livestock healthcare platform developed to help farmers in rural and remote areas obtain preliminary veterinary guidance before consulting a doctor.

The platform includes:

- Farmer and Doctor authentication
- AI-powered disease triage
- Animal management
- Doctor recommendations
- Admin dashboard
- English and Urdu language support

---

# Available Routes

| Route | Description |
|--------|-------------|
| `/` | Landing page |
| `/auth/signup` | User registration |
| `/auth/login` | User login |
| `/dashboard/farmer` | Farmer dashboard |
| `/dashboard/farmer/case/[id]` | Farmer case details |
| `/dashboard/doctor` | Doctor dashboard |
| `/dashboard/doctor/register` | Doctor registration |
| `/admin` | Admin dashboard |
| `/api/animals` | Animal API |
| `/api/cases` | Create case |
| `/api/cases/[id]` | Update case |
| `/api/case-notes` | Case notes |
| `/api/triage` | AI disease triage |
| `/api/doctor/register` | Register doctor |
| `/api/admin/verify-doctor` | Verify doctor |

---

# Step 1 — Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>

cd malshifa
```

---

# Step 2 — Install Dependencies

```bash
npm install
```

---

# Step 3 — Configure Supabase

Create a new Supabase project.

Run the SQL file included in the project:

```
supabase/FINAL_setup.sql
```

This will create:

- Profiles
- Doctor Profiles
- Animals
- Cases
- Case Notes
- Row Level Security Policies
- Required Database Triggers

---

# Step 4 — Create Storage Buckets

Inside **Supabase Storage**, create the following **Private** buckets:

- symptom-photos
- doctor-certificates

---

# Step 5 — Configure Authentication

Go to:

Authentication → Providers → Email

Enable:

- Email Provider

Disable:

- Confirm Email (recommended during development)

---

# Step 6 — Environment Variables

Create a file named:

```
.env.local
```

Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
ADMIN_EMAIL=YOUR_ADMIN_EMAIL
```

**Important**

- Never upload `.env.local` to GitHub.
- Never commit API keys or secrets.
- Store all sensitive values only inside `.env.local`.

---

# Step 7 — Run the Project

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# Testing

## Farmer

- Register
- Login
- Add an animal
- Enter animal information
- Upload symptom images
- Submit a disease case
- Receive AI analysis

---

## Doctor

- Register
- Login
- View submitted cases
- Accept assigned cases
- Review symptoms
- Submit recommendations

---

## Admin

- Review doctor registrations
- Approve or reject doctors

---

# AI Feature

MalShifa uses **Google Gemini** to generate a preliminary veterinary assessment.

The AI analyzes:

- Animal details
- Reported symptoms
- Uploaded images (when available)

The AI provides:

- Possible conditions
- Urgency level
- Initial recommendations
- Guidance on whether professional veterinary care is recommended

---

# Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Backend

- Supabase
- PostgreSQL

## AI

- Google Gemini

## Deployment

- Vercel

---

# Project Structure

```
app/
components/
lib/
public/
screenshots/
supabase/
```

---

# Troubleshooting

### AI is not responding

- Verify your Gemini API key.
- Restart the development server after updating `.env.local`.

---

### Authentication issues

- Verify your Supabase URL and API keys.
- Ensure Email Authentication is enabled.

---

### Storage upload issues

- Verify both storage buckets exist.
- Ensure bucket permissions are configured correctly.

---

### Database errors

- Make sure `FINAL_setup.sql` has been executed successfully.
- Verify all required tables exist.

---

# Security

- Do not commit `.env.local`.
- Do not publish API keys.
- Use environment variables for all secrets.
- Regenerate any API key that has previously been exposed.
