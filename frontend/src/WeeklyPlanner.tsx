import { useState, useEffect } from 'react'
import { HealthScore } from './HealthScore'
import type { HouseholdProfile } from './HouseholdPanel'

type MealType = 'Lunch' | 'Dinner'

export type PlannedMeal = {
  meal_type: MealType
  recipe_id: string
  name: string
  cost_per_serving: number
  total_cost: number
  health_score: number
  nutrition_tags: string[]
  ingredients: string[]
  image_url?: string
  is_leftover?: boolean
}

export type DayPlan = {
  day: string
  meals: PlannedMeal[]
}

export type PlanResponse = {
  days: DayPlan[]
  estimated_weekly_total: number
  grocery_list: string[]
}

export type WeeklyPlannerProps = {
  household: HouseholdProfile
  plan: PlanResponse | null
  loading: boolean
  error: string | null
  onPlanUpdate: (newPlan: PlanResponse) => void
  onOpenHousehold: () => void
  onSelectRecipe: (recipeId: string) => void
  onChangeTab: (tab: 'shopping') => void
}

export function WeeklyPlanner({ 
  household, 
  plan, 
  loading, 
  error,
  onPlanUpdate,
  onOpenHousehold, 
  onSelectRecipe,
  onChangeTab
}: WeeklyPlannerProps) {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const [swapping, setSwapping] = useState<{ day: string; type: MealType } | null>(null)
  
  // Recipe Preview State
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<any | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  useEffect(() => {
      if (!previewId) {
          setPreviewData(null)
          return
      }
      const load = async () => {
          setLoadingPreview(true)
          try {
              const res = await fetch(`/api/recipes/${previewId}`)
              if (res.ok) setPreviewData(await res.json())
          } catch(e) { console.error(e) }
          finally { setLoadingPreview(false) }
      }
      load()
  }, [previewId])

  const updateGroceryList = (days: DayPlan[]): string[] => {
    const allIngredients: string[] = []
    days.forEach((day) => {
      day.meals.forEach((meal) => {
        if (meal.ingredients) {
          allIngredients.push(...meal.ingredients)
        }
      })
    })

    const counts: Record<string, number> = {}
    allIngredients.forEach((ing) => {
      counts[ing] = (counts[ing] || 0) + 1
    })

    return Object.entries(counts)
      .map(([ing, count]) => (count > 1 ? `${ing} (x${count})` : ing))
      .sort()
  }

  const handleSwap = async (dayName: string, meal: PlannedMeal, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent opening recipe
    if (!plan) return

    try {
      setSwapping({ day: dayName, type: meal.meal_type })
      const res = await fetch('/api/swap-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          household: {
            location: household.location,
            family_size: household.familySize,
            equipment: household.equipment,
            prefers_high_protein: household.nutritionGoal === 'higher_protein',
            is_vegetarian: household.is_vegetarian,
            is_gluten_free: household.is_gluten_free,
            enable_leftovers: household.enable_leftovers,
            avoids_ingredients: [],
          },
          meal_type: meal.meal_type,
          rejected_recipe_id: meal.recipe_id,
        }),
      })

      if (!res.ok) throw new Error('Swap failed')
      const newMeal = (await res.json()) as PlannedMeal

      // Update parent state via callback
      const newDays = plan.days.map((d) => {
          if (d.day !== dayName) return d
          return {
            ...d,
            meals: d.meals.map((m) =>
              m.meal_type === meal.meal_type ? newMeal : m
            ),
          }
      })

      const newTotal = newDays.reduce((sum, d) => {
          return sum + d.meals.reduce((s, m) => s + m.total_cost, 0)
      }, 0)

      onPlanUpdate({
          ...plan,
          days: newDays,
          estimated_weekly_total: newTotal,
          grocery_list: updateGroceryList(newDays),
      })

    } catch (err) {
      console.error(err)
    } finally {
      setSwapping(null)
    }
  }

  return (
    <section aria-label="Weekly meal planner" className="space-y-4">
      <header className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">This week</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Focused on lunch and dinner, not too data heavy.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenHousehold}
            className="text-xs sm:text-sm px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            Adjust household
          </button>
          <button
             type="button"
             disabled={!plan}
             onClick={() => onChangeTab('shopping')}
             className="text-xs sm:text-sm px-3 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
          >
            Grocery list
          </button>
          <button
            type="button"
            disabled={!plan || explaining}
            onClick={async () => {
              if (!plan) return
              try {
                setExplaining(true)
                setExplanation(null)
                const res = await fetch('/api/llm/explain-plan', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ plan, household: {
                    location: household.location,
                    family_size: household.familySize,
                    equipment: household.equipment,
                    prefers_high_protein: household.nutritionGoal === 'higher_protein',
                    is_vegetarian: household.is_vegetarian,
                    is_gluten_free: household.is_gluten_free,
                    avoids_ingredients: [],
                  } }),
                })
                if (!res.ok) throw new Error('Explain failed')
                const data = (await res.json()) as { summary: string }
                setExplanation(data.summary)
              } catch (e) {
                console.error(e)
                setExplanation('Could not explain this plan right now.')
              } finally {
                setExplaining(false)
              }
            }}
            className="text-xs sm:text-sm px-3 py-1 rounded-full border border-slate-200 bg-slate-900 text-white disabled:opacity-40"
          >
            {explaining ? 'Explaining…' : 'Explain plan'}
          </button>
        </div>
      </header>
      {loading && (
        <p className="text-sm text-slate-500">Loading this week&apos;s plan…</p>
      )}
      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {!loading && plan && (
        <div className="grid gap-3 sm:gap-4">
          {plan.days.map((day) => (
          <article
            key={day.day}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 sm:p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                {day.day}
              </h3>
              <span className="text-[0.7rem] sm:text-xs text-slate-500">Lunch & Dinner</span>
            </div>

            {day.meals.length === 0 ? (
                <div className="py-6 text-center border-2 border-dashed border-slate-100 rounded-lg">
                    <p className="text-sm text-slate-400">No recipes match your strict filters.</p>
                    <p className="text-xs text-slate-300 mt-1">Try relaxing your dietary settings.</p>
                </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {day.meals.map((meal) => (
                <button
                  key={`${day.day}-${meal.meal_type}-${meal.recipe_id}`}
                  type="button"
                  onClick={() => setPreviewId(meal.recipe_id)}
                  className="text-left rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 overflow-hidden flex transition"
                >
                  {meal.image_url && (
                    <div className="w-24 sm:w-28 flex-shrink-0 bg-slate-200">
                       <img src={meal.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-wide text-slate-500 flex items-center gap-2">
                        {meal.meal_type}
                        {meal.is_leftover && (
                            <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold">
                                ↺ Leftover
                            </span>
                        )}
                      </p>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">
                        {meal.name}
                      </p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">
                        ~£{meal.total_cost.toFixed(2)} for the household
                      </p>
                    </div>
                    <HealthScore
                      score={meal.health_score}
                      tags={meal.nutrition_tags}
                    />
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        disabled={swapping?.day === day.day && swapping?.type === meal.meal_type}
                        onClick={(e) => handleSwap(day.day, meal, e)}
                        className="text-[0.65rem] uppercase tracking-wider font-semibold text-slate-400 hover:text-slate-800 disabled:opacity-50 px-2 py-1 -mr-2 -mb-2"
                      >
                        {swapping?.day === day.day && swapping?.type === meal.meal_type
                          ? 'Swapping…'
                          : 'Swap'}
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </article>
          ))}
        </div>
      )}
      {plan && (
        <p className="text-xs sm:text-sm text-slate-500">
          Estimated weekly total: ~£{plan.estimated_weekly_total.toFixed(2)}
        </p>
      )}
            {explanation && (
              <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-700">
                {explanation}
              </div>
            )}
      
            {/* Recipe Preview Modal */}
      {previewId && (
          <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setPreviewId(null)}>
              <div 
                className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
              >
                  {loadingPreview ? (
                      <div className="p-8 text-center text-slate-500">Loading recipe details...</div>
                  ) : previewData ? (
                      <>
                        <div className="relative h-48 bg-slate-200 shrink-0">
                            {previewData.image_url && (
                                <img src={previewData.image_url} className="w-full h-full object-cover" alt="" />
                            )}
                            <button 
                                onClick={() => setPreviewId(null)}
                                className="absolute top-3 right-3 bg-white/90 p-1 rounded-full text-slate-700 shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <h2 className="text-xl font-bold text-slate-900 mb-1">{previewData.name}</h2>
                            <p className="text-sm text-slate-500 mb-4 capitalize">{previewData.cuisine} • ~£{previewData.base_cost_per_serving.toFixed(2)}/serving</p>
                            
                            <div className="flex gap-4 mb-6">
                                <div className="text-center px-3 py-2 bg-slate-50 rounded-lg">
                                    <div className="text-lg font-semibold text-slate-900">{previewData.nutrition.calories}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wide">Cals</div>
                                </div>
                                <div className="text-center px-3 py-2 bg-slate-50 rounded-lg">
                                    <div className="text-lg font-semibold text-slate-900">{previewData.nutrition.protein_g}g</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wide">Protein</div>
                                </div>
                                <div className="text-center px-3 py-2 bg-slate-50 rounded-lg">
                                    <div className="text-lg font-semibold text-slate-900">{previewData.steps.length}</div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wide">Steps</div>
                                </div>
                            </div>

                            <h3 className="font-semibold text-slate-900 mb-2">Ingredients</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 mb-6">
                                {previewData.ingredients.map((ing: string) => (
                                    <li key={ing}>{ing}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={() => {
                                    onSelectRecipe(previewId)
                                    setPreviewId(null)
                                }}
                                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                <span>👨‍🍳</span> Start Cooking
                            </button>
                        </div>
                      </>
                  ) : (
                      <div className="p-8 text-center text-red-500">Failed to load recipe.</div>
                  )}
              </div>
          </div>
      )}
    </section>
  )
}