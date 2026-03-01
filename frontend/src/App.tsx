import { useEffect, useState } from 'react'
import './App.css'
import { WeeklyPlanner, type PlanResponse } from './WeeklyPlanner'
import { CookMode, type Recipe } from './CookMode'
import { HouseholdPanel, type HouseholdProfile } from './HouseholdPanel'
import { GroceryList } from './GroceryList'
import { Pantry } from './Pantry'

type View = 'planner' | 'cook' | 'shopping' | 'pantry'

function App() {
  const [view, setView] = useState<View>('planner')
  const [household, setHousehold] = useState<HouseholdProfile>({
    location: 'default',
    familySize: 2,
    equipment: ['oven', 'hob'],
    nutritionGoal: 'balanced',
    is_vegetarian: false,
    is_gluten_free: false,
    enable_leftovers: false,
    avoids_ingredients: [],
  })
  const [showHouseholdPanel, setShowHouseholdPanel] = useState(false)
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(() => {
      return localStorage.getItem('kitchen-active-recipe') || null
  })
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  // Persist selected recipe
  useEffect(() => {
      if (selectedRecipeId) {
          localStorage.setItem('kitchen-active-recipe', selectedRecipeId)
      } else {
          localStorage.removeItem('kitchen-active-recipe')
      }
  }, [selectedRecipeId])

  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const [recipeError, setRecipeError] = useState<string | null>(null)

  // Plan State
  const [plan, setPlan] = useState<PlanResponse | null>(() => {
    const saved = localStorage.getItem('kitchen-plan')
    return saved ? JSON.parse(saved) : null
  })
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [planError, setPlanError] = useState<string | null>(null)

  const generatePlan = async (currentHousehold: HouseholdProfile) => {
      try {
        setLoadingPlan(true)
        setPlanError(null)

        const response = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            household: {
              location: currentHousehold.location,
              family_size: currentHousehold.familySize,
              equipment: currentHousehold.equipment,
              prefers_high_protein: currentHousehold.nutritionGoal === 'higher_protein',
              prefers_budget_friendly: currentHousehold.nutritionGoal === 'budget_friendly',
              is_vegetarian: currentHousehold.is_vegetarian ?? false,
              is_gluten_free: currentHousehold.is_gluten_free ?? false,
              enable_leftovers: currentHousehold.enable_leftovers ?? false,
              avoids_ingredients: currentHousehold.avoids_ingredients,
            },
          }),
        })

        if (!response.ok) {
          throw new Error(`Backend error ${response.status}`)
        }

        const data = (await response.json()) as PlanResponse
        setPlan(data)
      } catch (err) {
        setPlanError('Could not load plan. Is the backend running?')
        console.error(err)
      } finally {
        setLoadingPlan(false)
      }
  }

  // Initial Fetch (only if no plan)
  useEffect(() => {
    if (!plan) {
        generatePlan(household)
    }
  }, [])

  // Pantry State
  const [pantryItems, setPantryItems] = useState<string[]>([])
  const [loadingPantry, setLoadingPantry] = useState(false)

  // Fetch Pantry on Mount
  useEffect(() => {
      const fetchPantry = async () => {
          try {
              setLoadingPantry(true)
              const res = await fetch('/api/pantry')
              if (res.ok) {
                  const data = await res.json()
                  setPantryItems(data)
              }
          } catch (e) {
              console.error(e)
          } finally {
              setLoadingPantry(false)
          }
      }
      fetchPantry()
  }, [])

  const addToPantry = async (item: string) => {
      try {
          const res = await fetch('/api/pantry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: item }),
          })
          if (res.ok) {
              const data = await res.json()
              setPantryItems(data)
          }
      } catch (e) {
          console.error(e)
      }
  }

  const removeFromPantry = async (item: string) => {
      try {
          const res = await fetch(`/api/pantry/${item}`, {
              method: 'DELETE',
          })
          if (res.ok) {
              const data = await res.json()
              setPantryItems(data)
          }
      } catch (e) {
          console.error(e)
      }
  }

  // Filter Grocery List based on Pantry
  // If pantry has "Rice", and grocery list has "Rice (x2)", we remove it?
  // Or do we mark it as "In Pantry"?
  // For simplicity, let's filter it out if exact match or simple inclusion.
  const shoppingList = (plan?.grocery_list ?? []).filter(groceryItem => {
      // Clean up grocery item string (remove quantity)
      const cleanItem = groceryItem.replace(/\s*\(x\d+\)/, '').toLowerCase().trim()
      
      // Check if any pantry item matches
      // e.g. Pantry: "Rice", Grocery: "Basmati Rice" -> No match
      // e.g. Pantry: "Rice", Grocery: "Rice" -> Match
      return !pantryItems.some(pItem => pItem.toLowerCase() === cleanItem)
  })

  useEffect(() => {
    const loadRecipe = async () => {
      if (!selectedRecipeId) {
        setSelectedRecipe(null)
        return
      }

      try {
        setLoadingRecipe(true)
        setRecipeError(null)
        const res = await fetch(`/api/recipes/${selectedRecipeId}`)
        if (!res.ok) {
          throw new Error(`Backend error ${res.status}`)
        }
        const data = (await res.json()) as Recipe
        setSelectedRecipe(data)
      } catch (err) {
        console.error(err)
        setRecipeError('Could not load recipe details')
      } finally {
        setLoadingRecipe(false)
      }
    }

    loadRecipe()
  }, [selectedRecipeId])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Collective Kitchen</h1>
            <p className="text-xs text-slate-500">Location-aware, cost & nutrition optimised meal planning</p>
          </div>
          <nav className="flex gap-1 sm:gap-2 text-sm">
            <button
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm transition flex items-center gap-2 ${
                view === 'planner'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setView('planner')}
            >
              <span>📅</span> <span className="hidden sm:inline">Planner</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm transition flex items-center gap-2 ${
                view === 'shopping'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setView('shopping')}
            >
              <span>🛒</span> <span className="hidden sm:inline">Shopping</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm transition flex items-center gap-2 ${
                view === 'pantry'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setView('pantry')}
            >
              <span>🥫</span> <span className="hidden sm:inline">Pantry</span>
            </button>
            <button
              className={`px-3 py-1.5 rounded-full border text-xs sm:text-sm transition flex items-center gap-2 ${
                view === 'cook'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              onClick={() => setView('cook')}
            >
              <span>🍳</span> <span className="hidden sm:inline">Cook</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 sm:py-6">
        {view === 'planner' && (
          <WeeklyPlanner
            household={household}
            plan={plan}
            loading={loadingPlan}
            error={planError}
            onPlanUpdate={setPlan}
            onOpenHousehold={() => setShowHouseholdPanel(true)}
            onSelectRecipe={(id) => {
              setSelectedRecipeId(id)
              setView('cook')
            }}
            onChangeTab={setView}
          />
        )}
        {view === 'shopping' && (
             <GroceryList ingredients={shoppingList} />
        )}
        {view === 'pantry' && (
             <Pantry 
                items={pantryItems} 
                onAdd={addToPantry} 
                onRemove={removeFromPantry} 
                loading={loadingPantry} 
             />
        )}
        
        {/* Cook Mode (Preserved in DOM to keep Timer running) */}
        <div className={view === 'cook' ? 'block h-full' : 'hidden'}>
          <>
            {!selectedRecipeId && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl">
                        🍳
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Start Cooking</h3>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                            Select a meal from the <button onClick={() => setView('planner')} className="text-slate-900 underline font-medium">Planner</button> to see the instructions here.
                        </p>
                    </div>
                </div>
            )}
            {selectedRecipeId && (
                <>
                    {recipeError && (
                    <p className="text-sm text-red-600 mb-2">{recipeError}</p>
                    )}
                    {loadingRecipe && (
                    <p className="text-sm text-slate-500 mb-2">Loading recipe…</p>
                    )}
                    <CookMode recipe={selectedRecipe} initialServings={household.familySize} />
                </>
            )}
          </>
        </div>
      </main>

      {showHouseholdPanel && (
        <HouseholdPanel
          value={household}
          onChange={(newHousehold) => {
              setHousehold(newHousehold)
              generatePlan(newHousehold)
          }}
          onClose={() => setShowHouseholdPanel(false)}
        />
      )}
    </div>
  )
}

export default App
