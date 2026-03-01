# Development Guide

## Prerequisites
*   **Python 3.9+**
*   **Node.js 18+** & **pnpm**
*   **Git**

## Setup

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd kitchen-intelligence
    ```

2.  **Backend Setup**:
    ```bash
    # Create virtual environment
    python -m venv .venv
    
    # Activate (Windows)
    .venv\Scripts\activate
    # Activate (Mac/Linux)
    source .venv/bin/activate
    
    # Install dependencies
    pip install -r requirements.txt
    
    # Initialize Database
    python -m backend.init_db
    python -m backend.seed_variety
    ```

3.  **Frontend Setup**:
    ```bash
    cd frontend
    pnpm install
    cd ..
    ```

## Running Locally (Development Mode)

You need to run two terminals.

**Terminal 1 (Backend):**
```bash
# From project root
uvicorn backend.main:app --reload
```
API will be at `http://localhost:8000`.

**Terminal 2 (Frontend):**
```bash
cd frontend
pnpm run dev
```
UI will be at `http://localhost:5173`.

## Running Tests
We have a basic logic test script.
```bash
python test_grocery.py
```
