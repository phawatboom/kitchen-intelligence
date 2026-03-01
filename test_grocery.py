from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_grocery_list():
    response = client.post("/api/plan", json={
        "week_start": "Monday",
        "household": {
            "location": "London",
            "family_size": 2,
            "equipment": ["oven", "hob"],
            "prefers_high_protein": False,
            "prefers_budget_friendly": False,
            "avoids_ingredients": [],
        },
    })

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()

    grocery_list = data["grocery_list"]
    print("Grocery list generated:", len(grocery_list) > 0)
    print("Sample items:", grocery_list[:5])

    has_multiples = any("(x" in item for item in grocery_list)
    print("Has aggregated items:", has_multiples)

    for item in grocery_list:
        print(f" - {item}")


if __name__ == "__main__":
    test_grocery_list()
