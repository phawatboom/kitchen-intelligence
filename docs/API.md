# API Reference

The Backend API is built with **FastAPI**. It runs on port `8000` by default.

## Base URL
`http://localhost:8000`

## Endpoints

### Planning

#### `POST /api/plan`
Generates a full weekly meal plan.

*   **Request Body**:
    ```json
    {
      "week_start": "Monday",
      "household": {
        "location": "London",
        "family_size": 2,
        "equipment": ["oven", "hob"],
        "prefers_high_protein": true,
        "is_vegetarian": false,
        "is_gluten_free": false
      }
    }
    ```
*   **Response**: `PlanResponse` object containing 7 `DayPlan` objects and a `grocery_list`.

#### `POST /api/swap-meal`
Replaces a specific meal with a different one.

*   **Request Body**:
    ```json
    {
      "household": { ... },
      "meal_type": "Lunch",
      "rejected_recipe_id": "lentil_soup"
    }
    ```
*   **Response**: A single `PlannedMeal` object to replace the old one.

### Recipes

#### `GET /api/recipes/{recipe_id}`
Fetches full details for a specific recipe, including steps and image URL.

### Feedback

#### `POST /api/feedback`
Submits user feedback after cooking.

*   **Request Body**:
    ```json
    {
      "recipe_id": "chickpea_wraps",
      "liked": true,
      "notes": "Added extra chili."
    }
    ```

### AI Stubs (Future Integration)

#### `POST /api/llm/explain-plan`
Returns a textual summary of the plan.

#### `POST /api/llm/adapt-recipe`
Returns modified instructions (e.g., "Make it cheaper").
