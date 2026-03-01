import pandas as pd
import ast
import random
from backend.database import SessionLocal, RecipeModel, RecipeStepModel

def get_equipment(steps_text):
    equipment = []
    text = steps_text.lower()
    if any(word in text for word in ["oven", "bake", "roast", "broil"]):
        equipment.append("oven")
    if any(word in text for word in ["pan", "fry", "sauté", "boil", "simmer", "pot", "hob", "stove"]):
        equipment.append("hob")
    if any(word in text for word in ["microwave"]):
        equipment.append("microwave")
    if any(word in text for word in ["slow cooker", "crockpot", "slow-cooker"]):
        equipment.append("slow_cooker")
    
    if not equipment:
        equipment = ["hob"] # Default
    return list(set(equipment))

def get_image_url(name):
    # Very basic keyword mapping for images
    keywords = {
        "chicken": "https://images.unsplash.com/photo-1594756202469-9ff9799b2e42?auto=format&fit=crop&w=800&q=80",
        "salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
        "soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
        "pasta": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=800&q=80",
        "beef": "https://images.unsplash.com/photo-1546241072-48010ad28c2c?auto=format&fit=crop&w=800&q=80",
        "fish": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80",
        "cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
        "pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    }
    for kw, url in keywords.items():
        if kw in name.lower():
            return url
    return "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80" # Default healthy plate

def import_recipes(csv_path, limit=50):
    print(f"Reading {csv_path}...")
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return

    db = SessionLocal()
    
    # Filter for recipes that have steps and nutrition
    df = df.dropna(subset=['steps', 'nutrition', 'ingredients'])
    
    count = 0
    for _, row in df.iterrows():
        if count >= limit:
            break
            
        recipe_id = str(row['id'])
        
        # Check if already exists
        if db.query(RecipeModel).filter(RecipeModel.id == recipe_id).first():
            continue

        try:
            # Parse list strings
            steps = ast.literal_eval(row['steps'])
            ingredients = ast.literal_eval(row['ingredients'])
            nutrition = ast.literal_eval(row['nutrition']) # [cal, fat, sugar, sod, pro, satfat, carb]
            tags = ast.literal_eval(row['tags'])
            
            cuisine = "global"
            cuisine_tags = ["italian", "mexican", "chinese", "indian", "mediterranean", "french", "japanese", "thai"]
            for tag in tags:
                if tag in cuisine_tags:
                    cuisine = tag
                    break

            recipe = RecipeModel(
                id=recipe_id,
                name=row['name'].title(),
                cuisine=cuisine,
                required_equipment=get_equipment(row['steps']),
                ingredients=ingredients,
                base_cost_per_serving=round(random.uniform(1.0, 5.0), 2),
                image_url=get_image_url(row['name']),
                calories=int(nutrition[0]),
                protein_g=int(nutrition[4]), # Note: Food.com uses PDV, but we use it as grams for now
                carbs_g=int(nutrition[6]),
                fat_g=int(nutrition[1]),
            )
            db.add(recipe)
            db.flush() # Get recipe added to session

            for i, step_text in enumerate(steps):
                step = RecipeStepModel(
                    recipe_id=recipe_id,
                    number=i + 1,
                    text=step_text,
                    duration_minutes=None # Could estimate from row['minutes'] but it's for the whole recipe
                )
                db.add(step)
            
            db.commit()
            count += 1
            if count % 10 == 0:
                print(f"Imported {count} recipes...")
        except Exception as e:
            db.rollback()
            print(f"Skipping recipe {recipe_id} due to error: {e}")

    print(f"Successfully imported {count} new recipes.")
    db.close()

if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "RAW_recipes.csv"
    import_recipes(path)
