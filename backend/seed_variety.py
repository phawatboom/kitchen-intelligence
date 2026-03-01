from backend.database import SessionLocal, RecipeModel, RecipeStepModel
import random

def seed_variety():
    db = SessionLocal()
    
    # List of 20 diverse recipes to make the app feel "real"
    new_recipes = [
        {
            "id": "classic_spaghetti",
            "name": "Classic Spaghetti Carbonara",
            "cuisine": "italian",
            "equipment": ["hob"],
            "ingredients": ["spaghetti", "eggs", "pecorino cheese", "guanciale", "black pepper"],
            "cost": 2.5,
            "img": "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
            "nutrition": [650, 25, 45, 30],
            "steps": ["Boil pasta.", "Fry guanciale.", "Mix eggs and cheese.", "Combine all with pepper."]
        },
        {
            "id": "beef_stir_fry",
            "name": "Quick Beef & Broccoli Stir-fry",
            "cuisine": "chinese",
            "equipment": ["hob"],
            "ingredients": ["beef strips", "broccoli", "soy sauce", "ginger", "garlic", "rice"],
            "cost": 3.8,
            "img": "https://images.unsplash.com/photo-1512058560366-cd2427ff56f3?auto=format&fit=crop&w=800&q=80",
            "nutrition": [520, 35, 30, 15],
            "steps": ["Cook rice.", "Sear beef in a hot pan.", "Add broccoli and sauce.", "Serve over rice."]
        },
        {
            "id": "greek_salad",
            "name": "Hearty Greek Salad",
            "cuisine": "mediterranean",
            "equipment": ["hob"], # For boiling eggs maybe, or just no equipment
            "ingredients": ["cucumber", "tomatoes", "feta cheese", "olives", "red onion", "olive oil"],
            "cost": 2.2,
            "img": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
            "nutrition": [350, 10, 15, 25],
            "steps": ["Chop vegetables.", "Mix in a bowl.", "Add feta and olives.", "Drizzle with oil."]
        },
        {
            "id": "taco_night",
            "name": "Family Taco Night",
            "cuisine": "mexican",
            "equipment": ["hob"],
            "ingredients": ["ground beef", "taco shells", "lettuce", "cheese", "salsa", "sour cream"],
            "cost": 4.5,
            "img": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
            "nutrition": [700, 30, 40, 35],
            "steps": ["Brown the beef.", "Warm the shells.", "Prepare toppings.", "Assemble tacos."]
        },
        {
            "id": "salmon_veg",
            "name": "Baked Salmon & Asparagus",
            "cuisine": "global",
            "equipment": ["oven"],
            "ingredients": ["salmon fillet", "asparagus", "lemon", "butter", "garlic"],
            "cost": 6.5,
            "img": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
            "nutrition": [450, 40, 5, 28],
            "steps": ["Preheat oven to 200C.", "Place salmon and asparagus on a tray.", "Top with butter and lemon.", "Bake for 15 minutes."]
        },
        {
            "id": "mushroom_risotto",
            "name": "Creamy Mushroom Risotto",
            "cuisine": "italian",
            "equipment": ["hob"],
            "ingredients": ["arborio rice", "mushrooms", "vegetable stock", "parmesan", "white wine", "onion"],
            "cost": 3.0,
            "img": "https://images.unsplash.com/photo-1476124369491-e7addf5db371?auto=format&fit=crop&w=800&q=80",
            "nutrition": [580, 15, 65, 20],
            "steps": ["Sauté onions and mushrooms.", "Add rice and toast slightly.", "Add stock ladle by ladle.", "Stir in cheese."]
        },
        {
            "id": "butter_chicken",
            "name": "Easy Butter Chicken",
            "cuisine": "indian",
            "equipment": ["hob"],
            "ingredients": ["chicken breast", "tomato puree", "cream", "butter", "garam masala", "rice"],
            "cost": 4.0,
            "img": "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80",
            "nutrition": [750, 45, 50, 38],
            "steps": ["Cook chicken in butter.", "Add spices and tomato.", "Stir in cream.", "Serve with rice."]
        },
        {
            "id": "veggie_burger",
            "name": "Ultimate Veggie Burger",
            "cuisine": "global",
            "equipment": ["hob"],
            "ingredients": ["black beans", "breadcrumbs", "egg", "burger buns", "avocado", "sweet potato fries"],
            "cost": 3.2,
            "img": "https://images.unsplash.com/photo-1520116467321-f14f7d8f539c?auto=format&fit=crop&w=800&q=80",
            "nutrition": [600, 20, 70, 18],
            "steps": ["Mash beans with egg and crumbs.", "Form into patties.", "Fry until crispy.", "Serve in buns."]
        },
        {
            "id": "pesto_pasta",
            "name": "Basil Pesto Pasta",
            "cuisine": "italian",
            "equipment": ["hob"],
            "ingredients": ["penne pasta", "basil", "pine nuts", "olive oil", "parmesan", "garlic"],
            "cost": 2.8,
            "img": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80",
            "nutrition": [500, 12, 55, 25],
            "steps": ["Boil pasta.", "Blend basil, nuts, oil, and cheese.", "Mix pesto with pasta.", "Serve warm."]
        },
        {
            "id": "shepherds_pie",
            "name": "Classic Shepherd's Pie",
            "cuisine": "global",
            "equipment": ["oven", "hob"],
            "ingredients": ["lamb mince", "mashed potatoes", "peas", "carrots", "onion", "beef stock"],
            "cost": 4.2,
            "img": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
            "nutrition": [620, 35, 40, 28],
            "steps": ["Cook meat and veg.", "Place in baking dish.", "Top with mash.", "Bake until golden."]
        }
    ]

    for r_data in new_recipes:
        if db.query(RecipeModel).filter(RecipeModel.id == r_data["id"]).first():
            continue
            
        recipe = RecipeModel(
            id=r_data["id"],
            name=r_data["name"],
            cuisine=r_data["cuisine"],
            required_equipment=r_data["equipment"],
            ingredients=r_data["ingredients"],
            base_cost_per_serving=r_data["cost"],
            image_url=r_data["img"],
            calories=r_data["nutrition"][0],
            protein_g=r_data["nutrition"][1],
            carbs_g=r_data["nutrition"][2],
            fat_g=r_data["nutrition"][3],
        )
        db.add(recipe)
        db.flush()

        for i, text in enumerate(r_data["steps"]):
            step = RecipeStepModel(
                recipe_id=recipe.id,
                number=i+1,
                text=text
            )
            db.add(step)
    
    db.commit()
    print(f"Added {len(new_recipes)} variety recipes.")
    db.close()

if __name__ == "__main__":
    seed_variety()
