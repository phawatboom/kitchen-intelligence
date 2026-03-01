from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Dict, Literal, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db, RecipeModel, RecipeStepModel, PantryItemModel, FeedbackModel
from backend.schemas import (
    HealthCheckResponse, Recipe, RecipeStep, RecipeNutrition, 
    HouseholdProfile, PlannedMeal, DayPlan, PlanRequest, PlanResponse, 
    Feedback, SwapMealRequest, ExplainPlanRequest, ExplainPlanResponse, 
    AdaptRecipeRequest, AdaptRecipeResponse, PantryItem, Equipment,
    CategorizeGroceriesRequest, CategorizeGroceriesResponse
)
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() # Load .env file

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(
    title="Collective Kitchen OS API",
    version="0.1.0",
    description="location aware, cost and nutrition optimised family meal planner",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthCheckResponse)
def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(status="ok")

# Helper to map flattened SQL model to nested Pydantic model
def map_recipe_model_to_schema(model: RecipeModel) -> Recipe:
    nutrition = RecipeNutrition(
        calories=model.calories,
        protein_g=model.protein_g,
        carbs_g=model.carbs_g,
        fat_g=model.fat_g,
    )
    # Sort steps by number just in case
    sorted_steps = sorted(model.steps, key=lambda x: x.number)
    steps = [RecipeStep(number=s.number, text=s.text, duration_minutes=s.duration_minutes) for s in sorted_steps]
    
    return Recipe(
        id=model.id,
        name=model.name,
        cuisine=model.cuisine,
        required_equipment=model.required_equipment,
        ingredients=model.ingredients,
        nutrition=nutrition,
        steps=steps,
        base_cost_per_serving=model.base_cost_per_serving,
        image_url=model.image_url,
    )

def _compute_health_score(recipe: Recipe, prefers_high_protein: bool) -> int:
    score = 70
    if recipe.nutrition.protein_g >= 25:
        score += 10
    if recipe.nutrition.carbs_g <= 40:
        score += 5
    if prefers_high_protein and recipe.nutrition.protein_g >= 20:
        score += 5
    return max(0, min(100, score))


def _nutrition_tags(recipe: Recipe) -> List[str]:
    tags: List[str] = []
    if recipe.nutrition.protein_g >= 20:
        tags.append("High protein")
    if recipe.nutrition.carbs_g <= 40:
        tags.append("Low carb")
    if 350 <= recipe.nutrition.calories <= 600:
        tags.append("Balanced")
    return tags


def _get_location_multiplier(location: str) -> float:
    loc = location.lower()
    if "london" in loc or "nyc" in loc or "zurich" in loc:
        return 1.45
    if "paris" in loc or "sf" in loc or "tokyo" in loc:
        return 1.3
    if "manchester" in loc or "berlin" in loc:
        return 1.15
    return 1.0

@app.get("/api/pantry", response_model=List[str])
def get_pantry(db: Session = Depends(get_db)) -> List[str]:
    items = db.query(PantryItemModel).all()
    return [i.name for i in items]

@app.post("/api/pantry")
def add_pantry_item(item: PantryItem, db: Session = Depends(get_db)) -> List[str]:
    # Check if exists
    exists = db.query(PantryItemModel).filter(func.lower(PantryItemModel.name) == item.name.lower()).first()
    if not exists:
        db.add(PantryItemModel(name=item.name))
        db.commit()
    
    # Return updated list
    items = db.query(PantryItemModel).all()
    return [i.name for i in items]

@app.delete("/api/pantry/{name}")
def remove_pantry_item(name: str, db: Session = Depends(get_db)) -> List[str]:
    db.query(PantryItemModel).filter(func.lower(PantryItemModel.name) == name.lower()).delete(synchronize_session=False)
    db.commit()
    
    items = db.query(PantryItemModel).all()
    return [i.name for i in items]

def _pick_recipes_for_household(household: HouseholdProfile, db: Session) -> List[Recipe]:
    suitable: List[Recipe] = []
    equipment_set = set(household.equipment)
    avoid_set = {i.lower() for i in household.avoids_ingredients}

    # Query all recipes from DB
    models = db.query(RecipeModel).all()
    all_recipes = [map_recipe_model_to_schema(m) for m in models]
    
    # Pre-calculate cost multiplier
    multiplier = _get_location_multiplier(household.location)

    # Fetch pantry items for prioritization
    pantry_items = [i.name.lower() for i in db.query(PantryItemModel).all()]

    for recipe in all_recipes:
        # 1. Equipment Check
        if not set(recipe.required_equipment).issubset(equipment_set):
            continue
            
        # 2. Ingredient Avoidance
        # Tokenize ingredients to avoid partial matches like "chickpea" matching "pea"
        recipe_ing_tokens = set()
        for ing in recipe.ingredients:
            recipe_ing_tokens.update(ing.lower().split())
            
        if any(bad in recipe_ing_tokens for bad in avoid_set):
            continue
            
        # 3. Dietary Restrictions (Token-based)
        if household.is_vegetarian:
            meat_keywords = {"chicken", "beef", "pork", "lamb", "steak", "bacon", "ham", "fish", "salmon", "tuna", "shrimp", "sausage", "meat"}
            # Check intersection
            if not recipe_ing_tokens.isdisjoint(meat_keywords):
                continue
        
        if household.is_gluten_free:
            # For GF, it's harder because "soy sauce" contains wheat but "soy" is fine.
            # We'll stick to string matching for specific phrases, but token matching for single words.
            gluten_phrases = ["soy sauce", "whole wheat"]
            gluten_tokens = {"flour", "bread", "pasta", "spaghetti", "penne", "wheat", "barley", "rye", "couscous"}
            
            recipe_text = " ".join(recipe.ingredients).lower()
            if any(phrase in recipe_text for phrase in gluten_phrases):
                continue
            if not recipe_ing_tokens.isdisjoint(gluten_tokens):
                continue

        # Adjust cost based on location
        recipe.base_cost_per_serving = round(recipe.base_cost_per_serving * multiplier, 2)
        
        suitable.append(recipe)

    # Sort by Pantry Overlap (Descending)
    # We count how many pantry items appear in the recipe ingredients
    def pantry_score(r: Recipe) -> int:
        count = 0
        r_text = " ".join(r.ingredients).lower()
        for p_item in pantry_items:
            if p_item in r_text:
                count += 1
        return count

    if household.prefers_budget_friendly:
        suitable.sort(key=lambda r: r.base_cost_per_serving)
    else:
        suitable.sort(key=pantry_score, reverse=True)

    # If nothing is suitable, we return empty list rather than unsafe recipes.
    # The frontend or planner logic will handle 0 recipes by showing empty slots or alerts.
    
    return suitable


@app.post("/api/swap-meal", response_model=PlannedMeal)
def swap_meal(request: SwapMealRequest, db: Session = Depends(get_db)) -> PlannedMeal:
    household = request.household
    suitable_recipes = _pick_recipes_for_household(household, db)
    
    # Filter out the rejected recipe
    candidates = [r for r in suitable_recipes if r.id != request.rejected_recipe_id]
    
    if not candidates:
        candidates = suitable_recipes
        
    # Smart Swap: Prioritize Pantry Matches
    # Note: _pick_recipes_for_household already sorts by pantry score!
    # So `candidates` is already sorted best-first.
    
    # To avoid being deterministic (always picking the same #1), we pick from the top 3.
    import random
    top_n = min(len(candidates), 3)
    # If top_n is 0, we have an empty list, handled above? 
    # If candidates is empty, we reused suitable_recipes.
    
    if candidates:
        # Pick from top 3 to keep relevance high but add variety
        new_recipe = random.choice(candidates[:top_n])
    else:
        # Fallback if literally 0 recipes exist (dietary restriction too strict)
        # We probably should raise error or return rejected, but let's just crash safely
        raise HTTPException(status_code=404, detail="No suitable alternative recipes found.")

    cost = new_recipe.base_cost_per_serving * household.family_size
    score = _compute_health_score(new_recipe, household.prefers_high_protein)
    
    return PlannedMeal(
        meal_type=request.meal_type,
        recipe_id=new_recipe.id,
        name=new_recipe.name,
        cost_per_serving=new_recipe.base_cost_per_serving,
        total_cost=cost,
        health_score=score,
        nutrition_tags=_nutrition_tags(new_recipe),
        ingredients=new_recipe.ingredients,
        image_url=new_recipe.image_url,
    )


@app.post("/api/plan", response_model=PlanResponse)
def generate_plan(request: PlanRequest, db: Session = Depends(get_db)) -> PlanResponse:
    household = request.household
    recipes = _pick_recipes_for_household(household, db)
    
    if not recipes:
        # Return a valid empty plan so the frontend doesn't crash
        # Ideally we could return a "default safe meal" like "Toast" but empty is safer
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        empty_days = [DayPlan(day=d, meals=[]) for d in days]
        return PlanResponse(days=empty_days, estimated_weekly_total=0.0, grocery_list=[])

    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    planned_days: List[DayPlan] = []
    total = 0.0
    
    previous_dinner = None

    for idx, day in enumerate(days):
        # Lunch Logic
        # If leftovers enabled and we have a previous dinner, use it
        if household.enable_leftovers and previous_dinner:
            lunch_recipe = previous_dinner
            is_lunch_leftover = True
        else:
            lunch_recipe = recipes[idx % len(recipes)]
            is_lunch_leftover = False

        # Dinner Logic
        dinner_recipe = recipes[(idx + 1) % len(recipes)]
        
        # Calculate Costs
        lunch_cost = lunch_recipe.base_cost_per_serving * household.family_size
        dinner_cost = dinner_recipe.base_cost_per_serving * household.family_size
        
        # Adjust for location
        # Note: base_cost_per_serving is already adjusted in _pick_recipes_for_household?
        # Let's check _pick_recipes_for_household implementation.
        # Yes, it updates the recipe objects in place (or copies). 
        # Wait, if we use the same recipe object across days, modification accumulates?
        # `map_recipe_model_to_schema` creates new objects.
        # `_pick_recipes` modifies them.
        # So we are fine reusing them.

        lunch_score = _compute_health_score(lunch_recipe, household.prefers_high_protein)
        dinner_score = _compute_health_score(dinner_recipe, household.prefers_high_protein)

        lunch = PlannedMeal(
            meal_type="Lunch",
            recipe_id=lunch_recipe.id,
            name=lunch_recipe.name,
            cost_per_serving=lunch_recipe.base_cost_per_serving,
            total_cost=lunch_cost,
            health_score=lunch_score,
            nutrition_tags=_nutrition_tags(lunch_recipe),
            ingredients=lunch_recipe.ingredients,
            image_url=lunch_recipe.image_url,
            is_leftover=is_lunch_leftover,
        )
        dinner = PlannedMeal(
            meal_type="Dinner",
            recipe_id=dinner_recipe.id,
            name=dinner_recipe.name,
            cost_per_serving=dinner_recipe.base_cost_per_serving,
            total_cost=dinner_cost,
            health_score=dinner_score,
            nutrition_tags=_nutrition_tags(dinner_recipe),
            ingredients=dinner_recipe.ingredients,
            image_url=dinner_recipe.image_url,
            is_leftover=False,
        )
        
        # Store for next day
        previous_dinner = dinner_recipe

        total += lunch_cost + dinner_cost
        planned_days.append(DayPlan(day=day, meals=[lunch, dinner]))

    from collections import Counter
    all_ingredients = []
    
    # Correct aggregation using planned meals
    for day_plan in planned_days:
        for meal in day_plan.meals:
            if meal.ingredients:
                all_ingredients.extend(meal.ingredients)

    ingredient_counts = Counter(all_ingredients)
    grocery_list = []
    for ing, count in ingredient_counts.items():
        if count > 1:
            grocery_list.append(f"{ing} (x{count})")
        else:
            grocery_list.append(ing)
    grocery_list.sort()

    return PlanResponse(days=planned_days, estimated_weekly_total=round(total, 2), grocery_list=grocery_list)


@app.get("/api/recipes/{recipe_id}", response_model=Recipe)
def get_recipe(recipe_id: str, db: Session = Depends(get_db)) -> Recipe:
    model = db.query(RecipeModel).filter(RecipeModel.id == recipe_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return map_recipe_model_to_schema(model)


@app.post("/api/feedback")
def submit_feedback(feedback: Feedback, db: Session = Depends(get_db)) -> dict:
    db_feedback = FeedbackModel(
        recipe_id=feedback.recipe_id,
        liked=feedback.liked,
        notes=feedback.notes
    )
    db.add(db_feedback)
    db.commit()
    return {"status": "ok"}


@app.post("/api/llm/explain-plan", response_model=ExplainPlanResponse)
def explain_plan(payload: ExplainPlanRequest) -> ExplainPlanResponse:
    """
    Uses Gemini AI to generate a human-friendly summary of the weekly meal plan.
    """
    if not GEMINI_API_KEY:
        # Fallback if no key is configured
        high_protein_days = sum(
            1 for d in payload.plan.days for m in d.meals if any("High protein" in t for t in m.nutrition_tags)
        )
        return ExplainPlanResponse(
            summary=f"Showing placeholder (No API Key). Plan has {high_protein_days} high protein days."
        )

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Construct a prompt with the context
        prompt = f"""
        You are a helpful home cooking assistant. Analyze this weekly meal plan for a household of {payload.household.family_size}.
        
        Household Context:
        - Location: {payload.household.location}
        - Goals: {"High Protein" if payload.household.prefers_high_protein else ("Budget Friendly" if payload.household.prefers_budget_friendly else "Balanced")}
        - Dietary: {"Vegetarian" if payload.household.is_vegetarian else "None"}
        
        The Plan (JSON summary):
        {payload.plan.model_dump_json(exclude={'grocery_list'})}
        
        Task:
        Write a 3-sentence summary of this week's menu. 
        1. Highlight the culinary theme or variety.
        2. Mention a specific benefit (e.g. cost saving, health).
        3. End with an encouraging remark.
        Keep it friendly and concise.
        """
        
        response = model.generate_content(prompt)
        return ExplainPlanResponse(summary=response.text)
        
    except Exception as e:
        print(f"Gemini Error: {e}")
        return ExplainPlanResponse(summary="Sorry, I couldn't analyze the plan right now.")


@app.post("/api/llm/adapt-recipe", response_model=AdaptRecipeResponse)
def adapt_recipe(payload: AdaptRecipeRequest) -> AdaptRecipeResponse:
    """
    Uses Gemini AI to rewrite recipe instructions based on user constraints.
    """
    if not GEMINI_API_KEY:
        # Fallback logic
        base_instructions = [step.text for step in payload.recipe.steps]
        notes: List[str] = []
        if any("no_oven" in c for c in payload.constraints):
            notes.append("Try pan-frying or using a hob-friendly method instead of baking.")
        if any("lower_cost" in c for c in payload.constraints):
            notes.append("Swap fresh ingredients for frozen/canned alternatives.")
        if any("vegetarian" in c for c in payload.constraints):
            notes.append("Replace meat with beans/lentils/tofu.")

        note = " ".join(notes) if notes else "No API Key configured."
        return AdaptRecipeResponse(adapted_instructions=base_instructions, note=note)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prepare data for prompt
        steps_text = "\n".join([f"{s.number}. {s.text}" for s in payload.recipe.steps])
        constraints_text = ", ".join(payload.constraints)
        
        prompt = f"""
        You are a helpful cooking assistant. Adapt this recipe based on the user's constraints.
        
        Original Recipe: {payload.recipe.name}
        Ingredients: {", ".join(payload.recipe.ingredients)}
        Steps:
        {steps_text}
        
        Constraints to apply: {constraints_text}
        
        Task:
        1. Rewrite the cooking instructions to strictly follow the constraints (e.g. if 'no_oven', change baking to pan-frying). Keep them numbered.
        2. Provide a short, friendly note explaining the key changes.
        
        Return STRICT JSON format:
        {{
          "adapted_instructions": ["Step 1 text", "Step 2 text", ...],
          "note": "Explanation here"
        }}
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        import json
        import re
        
        text = response.text
        # Clean up markdown code blocks if present
        if "```" in text:
            # Try to find json block
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                # Just strip backticks as fallback
                text = text.replace("```json", "").replace("```", "")
        
        data = json.loads(text)
        
        return AdaptRecipeResponse(
            adapted_instructions=data.get("adapted_instructions", []),
            note=data.get("note", "Recipe adapted successfully.")
        )
        
    except Exception as e:
        print(f"Gemini Adapt Error: {e}")
        # Fallback to original
    return AdaptRecipeResponse(adapted_instructions=base_instructions, note=note)

@app.post("/api/llm/categorize-groceries", response_model=CategorizeGroceriesResponse)
def categorize_groceries(payload: CategorizeGroceriesRequest) -> CategorizeGroceriesResponse:
    """
    Uses Gemini AI to sort grocery items into supermarket categories (Produce, Dairy, etc).
    """
    # If empty or no key, return single "Uncategorized" bucket
    if not payload.items or not GEMINI_API_KEY:
        return CategorizeGroceriesResponse(categories={"Shopping List": payload.items})

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        items_text = ", ".join(payload.items)
        
        prompt = f"""
        You are a helpful home assistant. Sort these grocery items into standard supermarket categories to help with shopping.
        
        Items: {items_text}
        
        Standard Categories to use (group logic):
        - Produce (Fruits, Vegetables, Herbs)
        - Dairy & Refrigerated (Milk, Cheese, Eggs, Yogurt)
        - Meat & Seafood
        - Pantry (Canned goods, Pasta, Rice, Spices, Oils, Baking)
        - Bakery
        - Frozen
        - Other
        
        Task:
        Return a strict JSON object mapping Category Name -> List of Items.
        Ensure EVERY item from the input is present in exactly one category.
        Do not add new items.
        
        Example JSON structure:
        {{
          "Produce": ["Apple", "Banana"],
          "Pantry": ["Rice"]
        }}
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        
        import json
        import re
        
        text = response.text
        # Clean up markdown if present
        if "```" in text:
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
            if match:
                text = match.group(1)
            else:
                text = text.replace("```json", "").replace("```", "")
        
        data = json.loads(text)
        return CategorizeGroceriesResponse(categories=data)
        
    except Exception as e:
        print(f"Gemini Categorize Error: {e}")
        # Fallback
        return CategorizeGroceriesResponse(categories={"List": payload.items})

# Serve Frontend (Must be last)
# We check if the 'dist' folder exists (created by build)
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # Allow API calls to pass through
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Check if file exists in dist (e.g. vite.svg)
        file_path = f"frontend/dist/{full_path}"
        if os.path.exists(file_path) and os.path.isfile(file_path):
             return FileResponse(file_path)
             
        # Otherwise return index.html for React Router
        return FileResponse("frontend/dist/index.html")