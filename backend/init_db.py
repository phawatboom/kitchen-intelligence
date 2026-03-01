from backend.database import engine, Base, SessionLocal, RecipeModel, RecipeStepModel

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = SessionLocal()
    
    # Check if data exists
    if session.query(RecipeModel).first():
        print("Database already initialized.")
        session.close()
        return

    print("Seeding database with initial recipes...")

    # Data from main.py (hardcoded for now to migrate)
    recipes_data = [
        {
            "id": "one_pan_lemon_chicken",
            "name": "One-pan lemon chicken & veg",
            "cuisine": "mediterranean",
            "required_equipment": ["oven"],
            "ingredients": [
                "chicken thighs", "potatoes", "carrots", "broccoli", "lemon", "olive oil"
            ],
            "base_cost_per_serving": 3.2,
            "image_url": "https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?auto=format&fit=crop&w=800&q=80",
            "nutrition": {"calories": 550, "protein_g": 40, "carbs_g": 35, "fat_g": 24},
            "steps": [
                {"number": 1, "text": "Preheat the oven to 200°C and line a large tray."},
                {"number": 2, "text": "Chop vegetables into bite-sized pieces and place on the tray."},
                {"number": 3, "text": "Add chicken, drizzle with oil, lemon juice, salt and pepper."},
                {"number": 4, "text": "Roast for 25–30 minutes until the chicken is cooked through.", "duration_minutes": 25},
            ]
        },
        {
            "id": "chickpea_wraps",
            "name": "Crispy chickpea salad wraps",
            "cuisine": "mediterranean",
            "required_equipment": ["hob"],
            "ingredients": ["chickpeas", "tortilla wraps", "lettuce", "yogurt", "spices"],
            "base_cost_per_serving": 1.8,
            "image_url": "https://images.unsplash.com/photo-1529006557810-274b9b2eb785?auto=format&fit=crop&w=800&q=80",
            "nutrition": {"calories": 420, "protein_g": 18, "carbs_g": 52, "fat_g": 12},
            "steps": [
                {"number": 1, "text": "Rinse chickpeas and pat dry."},
                {"number": 2, "text": "Pan-fry chickpeas with spices until crispy.", "duration_minutes": 5},
                {"number": 3, "text": "Fill wraps with lettuce, chickpeas and yogurt sauce."},
            ]
        },
        {
            "id": "lentil_soup",
            "name": "Tomato & red lentil soup",
            "cuisine": "global",
            "required_equipment": ["hob"],
            "ingredients": ["red lentils", "tinned tomatoes", "onion", "garlic", "stock"],
            "base_cost_per_serving": 1.2,
            "image_url": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
            "nutrition": {"calories": 380, "protein_g": 22, "carbs_g": 48, "fat_g": 6},
            "steps": [
                {"number": 1, "text": "Soften onion and garlic in a large pot."},
                {"number": 2, "text": "Add lentils, tomatoes and stock; bring to a simmer."},
                {"number": 3, "text": "Cook 20 minutes until lentils are soft; season to taste.", "duration_minutes": 20},
            ]
        }
    ]

    for r_data in recipes_data:
        recipe = RecipeModel(
            id=r_data["id"],
            name=r_data["name"],
            cuisine=r_data["cuisine"],
            required_equipment=r_data["required_equipment"],
            ingredients=r_data["ingredients"],
            base_cost_per_serving=r_data["base_cost_per_serving"],
            image_url=r_data["image_url"],
            calories=r_data["nutrition"]["calories"],
            protein_g=r_data["nutrition"]["protein_g"],
            carbs_g=r_data["nutrition"]["carbs_g"],
            fat_g=r_data["nutrition"]["fat_g"],
        )
        session.add(recipe)
        session.commit() # Commit recipe first to establish ID

        for s_data in r_data["steps"]:
            step = RecipeStepModel(
                recipe_id=recipe.id,
                number=s_data["number"],
                text=s_data["text"],
                duration_minutes=s_data.get("duration_minutes")
            )
            session.add(step)
        
        session.commit()

    print("Seeding complete.")
    session.close()

if __name__ == "__main__":
    init_db()
