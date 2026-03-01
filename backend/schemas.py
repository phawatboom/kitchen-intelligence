from pydantic import BaseModel, ConfigDict
from typing import List, Literal, Optional, Dict

# Enums
Equipment = Literal["oven", "hob", "microwave", "slow_cooker"]

# Base Models
class HealthCheckResponse(BaseModel):
    status: str

class RecipeNutrition(BaseModel):
    calories: int
    protein_g: int
    carbs_g: int
    fat_g: int

class RecipeStep(BaseModel):
    number: int
    text: str
    duration_minutes: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class Recipe(BaseModel):
    id: str
    name: str
    cuisine: str
    required_equipment: List[str]
    ingredients: List[str]
    nutrition: RecipeNutrition
    steps: List[RecipeStep]
    base_cost_per_serving: float
    image_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class HouseholdProfile(BaseModel):
    location: str = "default"
    family_size: int = 2
    equipment: List[Equipment] = []
    prefers_high_protein: bool = False
    prefers_budget_friendly: bool = False
    is_vegetarian: bool = False
    is_gluten_free: bool = False
    enable_leftovers: bool = False
    avoids_ingredients: List[str] = []

class PlannedMeal(BaseModel):
    meal_type: Literal["Lunch", "Dinner"]
    recipe_id: str
    name: str
    cost_per_serving: float
    total_cost: float
    health_score: int
    nutrition_tags: List[str]
    ingredients: List[str]
    image_url: Optional[str] = None
    is_leftover: bool = False

class DayPlan(BaseModel):
    day: str
    meals: List[PlannedMeal]

class PlanRequest(BaseModel):
    week_start: str = "Monday"
    household: HouseholdProfile

class PlanResponse(BaseModel):
    days: List[DayPlan]
    estimated_weekly_total: float
    grocery_list: List[str]

class Feedback(BaseModel):
    plan_id: Optional[str] = None
    recipe_id: Optional[str] = None
    liked: bool
    notes: Optional[str] = None

class SwapMealRequest(BaseModel):
    household: HouseholdProfile
    meal_type: Literal["Lunch", "Dinner"]
    rejected_recipe_id: str

class ExplainPlanRequest(BaseModel):
    plan: PlanResponse
    household: HouseholdProfile

class ExplainPlanResponse(BaseModel):
    summary: str

class AdaptRecipeRequest(BaseModel):
    recipe: Recipe
    constraints: List[str] = []

class AdaptRecipeResponse(BaseModel):
    adapted_instructions: List[str]
    note: str

class PantryItem(BaseModel):
    name: str

class CategorizeGroceriesRequest(BaseModel):
    items: List[str]

class CategorizeGroceriesResponse(BaseModel):
    categories: Dict[str, List[str]]
