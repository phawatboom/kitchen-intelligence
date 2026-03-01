# Database & Persistence

## Schema (SQLAlchemy)

The application uses a relational schema stored in SQLite.

### `recipes` Table
Stores the static data for meals.
*   `id` (PK, String): Unique identifier (e.g., "one_pan_lemon_chicken").
*   `name` (String): Display name.
*   `cuisine` (String): Tag for filtering.
*   `required_equipment` (JSON): List of strings (e.g., `["oven"]`).
*   `ingredients` (JSON): List of raw ingredient strings.
*   `base_cost_per_serving` (Float): Base currency cost.
*   `calories`, `protein_g`, `carbs_g`, `fat_g` (Integer): Macros.
*   `image_url` (String): URL to Unsplash image.

### `recipe_steps` Table
Stores the cooking instructions, linked to recipes.
*   `id` (PK, Integer)
*   `recipe_id` (FK, String)
*   `number` (Integer): Step order.
*   `text` (String): Instruction text.
*   `duration_minutes` (Integer, Nullable): Time for timer feature.

## Data Seeding

Since the app relies on content, we provide scripts to populate the database.

### 1. `backend/init_db.py`
*   Initializes the database structure (tables).
*   Seeds 3 core "hardcoded" recipes to ensure the app always works out-of-the-box.

### 2. `backend/seed_variety.py`
*   Adds **10 diverse recipes** (Italian, Mexican, Indian, etc.).
*   Run this to test the "Swapping" feature and variety logic.

### 3. `backend/import_kaggle.py`
*   Designed for **Mass Import**.
*   Reads a `RAW_recipes.csv` file (e.g., from Food.com dataset).
*   Intelligently parses ingredients and maps nutrition data.
*   Assigns plausible images based on keyword matching.

## Persistence Strategy

*   **Development**: `kitchen.db` is stored in the project root.
*   **Docker**: Mapped to a volume `/app/data` to survive container restarts.
*   **Fly.io**: Mapped to a persistent Volume.
