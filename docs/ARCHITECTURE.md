# Architecture & Design

## Technology Stack

### Frontend (Client)
*   **Framework**: [React 19](https://react.dev/) + TypeScript
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **State Management**: React Hooks (`useState`, `useEffect`) + Context API (if needed in future).
*   **HTTP Client**: Native `fetch` API.

### Backend (Server)
*   **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.9+)
*   **Database**: SQLite (Internal file `kitchen.db`)
*   **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
*   **Data Validation**: [Pydantic](https://docs.pydantic.dev/)

### Infrastructure (Dev & Deploy)
*   **Containerization**: Docker (Multi-stage build)
*   **Orchestration**: Docker Compose
*   **Proxy**: Nginx (optional, for production domain handling)

---

## Directory Structure

```text
kitchen-intelligence/
├── backend/                # Python FastAPI Backend
│   ├── database.py         # SQLAlchemy Setup & Models
│   ├── main.py             # API Endpoints & Logic
│   ├── init_db.py          # Database Initialization Script
│   ├── seed_variety.py     # Seed script for variety recipes
│   └── import_kaggle.py    # Script to import Kaggle datasets
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── App.tsx         # Main Routing & Layout
│   │   ├── WeeklyPlanner.tsx # Core Planning View
│   │   ├── CookMode.tsx    # Step-by-step Cooking View
│   │   ├── GroceryList.tsx # Shopping List View
│   │   └── ...
├── nginx/                  # Nginx Configuration
├── docs/                   # Documentation
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Local/VPS orchestration config
├── fly.toml                # Fly.io deployment config
└── kitchen.db              # SQLite Database (Git-ignored in real scenarios)
```

## Data Flow

1.  **User Request**: The React Frontend sends a JSON payload (e.g., Household Profile) to the Backend API.
2.  **API Processing**: FastAPI validates the request using Pydantic models.
3.  **Logic Layer**:
    *   The backend calculates cost multipliers based on Location.
    *   It filters recipes based on Equipment and Dietary Restrictions.
    *   It generates a schedule (Lunch/Dinner) for 7 days.
4.  **Database Access**: SQLAlchemy queries the `kitchen.db` SQLite file.
5.  **Response**: The backend returns a JSON object containing the `Plan` and the aggregated `GroceryList`.
6.  **Rendering**: The Frontend updates the state and re-renders the UI.

## Key Design Decisions

### Why SQLite?
We chose **SQLite** for simplicity, zero-cost, and portability. Since the application is designed for households or single-family deployments, the concurrency limits of SQLite are not a bottleneck. It simplifies backup (copying a file) and deployment (mounting a volume).

### Vertical Slice Architecture
The project is built as a "Vertical Slice," meaning features are built end-to-end (DB -> API -> UI) rather than layer-by-layer. This allows for rapid prototyping of features like "Meal Swapping" or "Shopping Mode."
