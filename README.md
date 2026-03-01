# Collective Kitchen OS

**Kitchen Intelligence** is an AI-powered meal planning system that adapts to real households. It combines nutrition goals, ingredient costs, kitchen equipment, local availability, and personal food preferences to generate optimised weekly meal plans and grocery lists.

## 🚀 Key Features

*   **🥗 Intelligent Planning**: Generates 7-day lunch & dinner plans based on protein goals and equipment.
*   **🔄 Meal Swapping**: Don't like a meal? Swap it instantly. The AI recalculates costs and nutrition.
*   **🛒 Automated Shopping List**: Aggregates ingredients into a checklist (e.g., "Onion (x3)").
*   **🍳 Cook Mode**: Step-by-step cooking interface with built-in timers.
*   **🌍 Location Awareness**: Adjusts cost estimates based on your city (London, NYC, Paris, etc.).
*   **🌱 Dietary Filters**: Supports Vegetarian and Gluten-Free preferences.

## 📚 Documentation

Detailed documentation is available in the `docs/` folder:

*   [**Architecture & Design**](docs/ARCHITECTURE.md) - Tech stack, structure, and design decisions.
*   [**Features Guide**](docs/FEATURES.md) - Detailed breakdown of user features.
*   [**Database**](docs/DATABASE.md) - Schema, SQLite setup, and data seeding.
*   [**API Reference**](docs/API.md) - Backend endpoints.
*   [**Development Guide**](docs/DEVELOPMENT.md) - How to run locally.
*   [**Deployment Guide**](docs/DEPLOYMENT.md) - Deploy to Docker or Fly.io.

## ⚡ Quick Start (Local)

1.  **Backend**:
    ```bash
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    python -m backend.init_db
    uvicorn backend.main:app --reload
    ```

2.  **Frontend**:
    ```bash
    cd frontend
    pnpm install
    pnpm run dev
    ```

## 🐳 Quick Start (Docker)

```bash
docker-compose up --build
```
Access the app at `http://localhost:8000`.