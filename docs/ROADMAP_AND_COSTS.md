# Roadmap, Costs, and Implementation Guide

This document outlines the path to upgrading **Collective Kitchen OS** from a local prototype to a production-grade application with Authentication and Cloud AI.

---

## 1. AI Integration (Gemini)

We have integrated the `google-generativeai` library. To enable the "Brain" of the application:

### Setup Instructions
1.  **Get an API Key**: Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.
2.  **Configure Local Environment**:
    *   Create a file named `.env` in the project root.
    *   Add the line: `GEMINI_API_KEY=your_actual_key_here`
3.  **Restart Backend**: The app will automatically detect the key and switch from "Placeholder Mode" to "Real AI Mode".

### Features Enabled
*   **Explain Plan**: Summarizes the weekly menu, explaining *why* certain meals were picked based on your pantry and preferences.
*   **Adapt Recipe (Next Step)**: Will allow users to rewrite recipes (e.g., "Make this spicy").

### Cost Analysis
*   **Provider**: Google Gemini API
*   **Model**: `gemini-1.5-flash`
*   **Cost**:
    *   **Free Tier**: 15 RPM (Requests Per Minute), 1M TPM (Tokens Per Minute), 1,500 requests/day.
    *   **Paid Tier**: $0.35 / 1 million input tokens.
*   **Verdict**: **Free** for almost all personal and small startup use cases.

---

## 2. Authentication (Supabase)

To support multiple users (Login/Signup) and save data to the cloud, we recommend **Supabase**.

### Why Supabase?
*   It combines **Postgres Database**, **Auth** (Google/Email login), and **API** in one free package.
*   It plays perfectly with React (Frontend) and Python (Backend).

### Implementation Plan

#### Phase A: Infrastructure
1.  Create a free project at [supabase.com](https://supabase.com).
2.  Get `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

#### Phase B: Frontend (React)
1.  Install: `pnpm add @supabase/supabase-js`
2.  Create `AuthContext` to handle user sessions.
3.  Add a generic `<Login />` page.

#### Phase C: Backend (Python)
1.  **Migration**: Switch from SQLite (`kitchen.db`) to Supabase Postgres.
    *   *Change*: Update `DATABASE_URL` in `.env` to the Supabase connection string.
2.  **Schema Update**:
    *   Add `user_id` column to `pantry_items` and `household_profile` tables.
    *   This ensures User A doesn't see User B's pantry.

### Cost Analysis
*   **Provider**: Supabase
*   **Cost**:
    *   **Free Tier**: 500MB Database, 50,000 Monthly Active Users.
    *   **Pro Tier**: $25/month (if you scale).
*   **Verdict**: **Free** for personal use and prototypes.

---

## 3. Hosting & Deployment

### Recommended Stack: Fly.io
We currently use **Fly.io** for hosting the container.

### Architecture
*   **Frontend + Backend**: Packaged in one Docker container (efficient).
*   **Database**:
    *   *Option A (Current)*: SQLite on a Fly.io Volume.
    *   *Option B (Scaled)*: Supabase (External Cloud DB).

### Cost Analysis (Estimated Monthly)

| Service | Item | Cost (Hobby) | Cost (Growth) |
| :--- | :--- | :--- | :--- |
| **Hosting** | Fly.io (1 Shared CPU, 256MB RAM) | **Free** (allowance) | ~$5 / mo |
| **Database** | Supabase (500MB) | **Free** | $25 / mo |
| **AI** | Gemini 1.5 Flash | **Free** | Pay-as-you-go |
| **Domain** | Namecheap / GoDaddy | ~$10 / year | ~$10 / year |
| **Total** | | **~$0.80 / month** | **~$30 / month** |

---

## 4. Next Steps Checklist

- [x] **Step 1**: Integrate Gemini library (Done).
- [ ] **Step 2**: Get API Key and test "Explain Plan".
- [ ] **Step 3**: Sign up for Supabase (if Auth is desired).
- [ ] **Step 4**: Deploy to Fly.io using the generated `fly.toml`.
