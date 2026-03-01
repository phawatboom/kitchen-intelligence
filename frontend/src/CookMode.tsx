import { useState, useEffect } from 'react'

export type RecipeStep = {
  number: number
  text: string
  duration_minutes?: number
}

export type Recipe = {
  id: string
  name: string
  cuisine: string
  ingredients: string[]
  steps: RecipeStep[]
  image_url?: string
}

export type CookModeProps = {
  recipe: Recipe | null
  initialServings?: number
}


function Timer({ minutes, timerId }: { minutes: number, timerId: string }) {
  const [timeLeft, setTimeLeft] = useState(minutes * 60)
  const [isActive, setIsActive] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(() => {
      const saved = localStorage.getItem(timerId)
      return saved ? parseInt(saved, 10) : null
  })

  // Sync logic on mount / prop change
  useEffect(() => {
    if (endTime) {
        // We have a saved timer
        const now = Date.now()
        const remaining = Math.ceil((endTime - now) / 1000)
        if (remaining > 0) {
            setTimeLeft(remaining)
            setIsActive(true)
        } else {
            // Expired
            setTimeLeft(0)
            setIsActive(false)
            setEndTime(null)
            localStorage.removeItem(timerId)
        }
    } else {
        // New timer context
        setTimeLeft(minutes * 60)
        setIsActive(false)
    }
  }, [minutes, timerId]) // Rely on timerId changing to reset

  useEffect(() => {
    let interval: number | undefined

    if (isActive && timeLeft > 0) {
      if (!endTime) {
          const target = Date.now() + timeLeft * 1000
          setEndTime(target)
          localStorage.setItem(timerId, target.toString())
      }

      interval = setInterval(() => {
        if (!endTime) return
        const now = Date.now()
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
        
        setTimeLeft(remaining)
        
        if (remaining <= 0) {
            setIsActive(false)
            setEndTime(null)
            localStorage.removeItem(timerId)
        }
      }, 1000)
    } else if (!isActive && !endTime) {
        // Clean up if manually stopped (reset)
        localStorage.removeItem(timerId)
    }

    return () => clearInterval(interval)
  }, [isActive, timeLeft, endTime, timerId])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const progress = 1 - timeLeft / (minutes * 60)

  return (
    <div className="bg-slate-900 rounded-xl p-4 text-white flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 flex items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              className="text-slate-700"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
            />
            <circle
              className="text-emerald-400 transition-all duration-1000 ease-linear"
              strokeWidth="4"
              strokeDasharray={125.6}
              strokeDashoffset={125.6 * (1 - progress)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="20"
              cx="24"
              cy="24"
            />
          </svg>
          <span className="text-xs font-bold">{formatTime(timeLeft)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Timer</span>
          <span className="text-xs text-slate-400">
            {isActive ? 'Running...' : timeLeft === 0 ? 'Done!' : 'Paused'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
              if (isActive) {
                  // Pause logic: just stop interval, but keep endTime? 
                  // No, pause means we lose the target time.
                  // For simple implementation: Pause = Stop and reset time left to static.
                  // Real pause is hard with absolute time. 
                  // Let's make "Pause" actually just "Pause" locally, losing the absolute target.
                  setIsActive(false)
                  setEndTime(null) // Clear target, so next start recalculates based on current timeLeft
                  localStorage.removeItem(timerId)
              } else {
                  setIsActive(true)
              }
          }}
          className="px-3 py-1.5 rounded-full bg-white text-slate-900 text-xs font-semibold hover:bg-slate-100"
        >
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setIsActive(false)
            setTimeLeft(minutes * 60)
            setEndTime(null)
            localStorage.removeItem(timerId)
          }}
          className="px-3 py-1.5 rounded-full border border-slate-600 text-white text-xs hover:bg-slate-800"
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export function CookMode({ recipe, initialServings = 2 }: CookModeProps) {
  const recipeId = recipe?.id || 'none'
  const [servings, setServings] = useState(initialServings)
  
  // Helper to scale ingredients
  const getScaledIngredient = (ing: string) => {
      // Basic scaling: looks for leading number
      // Base servings for all recipes is assumed to be 2 for this MVP
      const scale = servings / 2
      
      // Regex to find leading number (integer or decimal)
      // e.g. "2 onions", "0.5 kg beef"
      return ing.replace(/^(\d+(\.\d+)?)/, (match) => {
          const val = parseFloat(match)
          if (isNaN(val)) return match
          // Round to 1 decimal place to avoid 3.00000001
          const scaled = val * scale
          return (Math.round(scaled * 10) / 10).toString()
      })
  }

  // Initialize state from localStorage
  const [index, setIndex] = useState(() => {
      const saved = localStorage.getItem(`cook-index-${recipeId}`)
      return saved ? parseInt(saved, 10) : 0
  })
  
  const [adaptedInstructions, setAdaptedInstructions] = useState<string[] | null>(() => {
      const saved = localStorage.getItem(`cook-adapted-steps-${recipeId}`)
      return saved ? JSON.parse(saved) : null
  })

  const [adaptationNote, setAdaptationNote] = useState<string | null>(() => {
      return localStorage.getItem(`cook-adapted-note-${recipeId}`)
  })

  // Persist changes
  useEffect(() => {
      if (recipeId !== 'none') {
          localStorage.setItem(`cook-index-${recipeId}`, index.toString())
      }
  }, [index, recipeId])

  useEffect(() => {
      if (recipeId !== 'none' && adaptedInstructions) {
          localStorage.setItem(`cook-adapted-steps-${recipeId}`, JSON.stringify(adaptedInstructions))
      }
  }, [adaptedInstructions, recipeId])

  useEffect(() => {
      if (recipeId !== 'none' && adaptationNote) {
          localStorage.setItem(`cook-adapted-note-${recipeId}`, adaptationNote)
      }
  }, [adaptationNote, recipeId])

  const steps = recipe?.steps ?? []
  
  // Current text to display
  const currentText = adaptedInstructions ? adaptedInstructions[index] : steps[index]?.text

  const [adapting, setAdapting] = useState(false)

  // Feedback State
  const [feedback, setFeedback] = useState<{ liked: boolean | null; notes: string }>({
    liked: null,
    notes: '',
  })
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)
  
  // Reset state ONLY if it's a completely different recipe we haven't seen
  useEffect(() => {
      const isNew = !localStorage.getItem(`cook-index-${recipe?.id}`)
      if (isNew) {
          setIndex(0)
          setAdaptedInstructions(null)
          setAdaptationNote(null)
          setFeedback({ liked: null, notes: '' })
          setSubmittedFeedback(false)
          setShowIngredients(false)
          setServings(initialServings)
      }
  }, [recipe?.id])

  const handleAdapt = async (constraint: string) => {
      if (!recipe) return
      try {
          setAdapting(true)
          setAdaptationNote(null)
          
          const res = await fetch('/api/llm/adapt-recipe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  recipe,
                  constraints: [constraint],
              }),
          })
          
          if (!res.ok) throw new Error('Adapt failed')
          
          const data = (await res.json()) as { adapted_instructions: string[], note: string }
          
          if (data.adapted_instructions && data.adapted_instructions.length > 0) {
              setAdaptedInstructions(data.adapted_instructions)
          }
          setAdaptationNote(data.note)
          
      } catch (e) {
          console.error(e)
          setAdaptationNote("Sorry, couldn't adapt the recipe right now.")
      } finally {
          setAdapting(false)
      }
  }

  const submitFeedback = async () => {
    if (!recipe || feedback.liked === null) return
    try {
        setSubmittingFeedback(true)
        const res = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe_id: recipe.id,
                liked: feedback.liked,
                notes: feedback.notes,
            }),
        })
        if (!res.ok) throw new Error('Feedback failed')
        setSubmittedFeedback(true)
    } catch (e) {
        console.error(e)
        // clean fail
    } finally {
        setSubmittingFeedback(false)
    }
  }

  const goPrev = () => setIndex((i) => Math.max(0, i - 1))
  const goNext = () => setIndex((i) => Math.min(steps.length - 1, i + 1))

  return (
    <section
      aria-label="Cook mode"
      className="flex flex-col gap-4 sm:gap-6 max-w-xl mx-auto h-full"
    >
      <header className="space-y-3">
        {recipe?.image_url && (
            <div className="w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-slate-200">
              <img src={recipe.image_url} alt="" className="w-full h-full object-cover" />
            </div>
        )}
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cook mode</p>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">
            {recipe ? recipe.name : 'Pick a meal from the planner'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Designed for phones first, but comfortable on desktop too.
          </p>
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {recipe && steps.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2 text-xs sm:text-sm text-slate-500">
              <span>
                Step {index + 1} of {steps.length}
              </span>
              <span>~30 mins total</span>
            </div>

            <article className="flex-1 rounded-2xl bg-white border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    Step {index + 1}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    {currentText}
                  </p>
                  {adapting && <p className="text-xs text-slate-500 animate-pulse">Adapting recipe...</p>}
                  {adaptationNote && (
                    <p className="text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      {adaptationNote}
                    </p>
                  )}
                </div>

                {steps[index]?.duration_minutes && (
                    <Timer 
                        minutes={steps[index].duration_minutes!} 
                        timerId={`timer-${recipe?.id}-${steps[index].number}`}
                    />
                )}
                
                {/* Ingredients Toggle */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                    <div className="flex items-center justify-between mb-2">
                        <button 
                            onClick={() => setShowIngredients(!showIngredients)}
                            className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1 hover:text-slate-800"
                        >
                            {showIngredients ? 'Hide Ingredients' : 'Show Ingredients'}
                            <svg className={`w-3 h-3 transition ${showIngredients ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {/* Portion Control */}
                        {showIngredients && (
                            <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1">
                                <span className="text-xs text-slate-500 font-medium">Serves:</span>
                                <button 
                                    onClick={() => setServings(Math.max(1, servings - 1))}
                                    className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >-</button>
                                <span className="text-xs font-bold text-slate-900 w-3 text-center">{servings}</span>
                                <button 
                                    onClick={() => setServings(servings + 1)}
                                    className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >+</button>
                            </div>
                        )}
                    </div>
                    
                    {showIngredients && (
                        <ul className="text-sm text-slate-700 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            {recipe.ingredients.map((ing) => (
                                <li key={ing} className="flex items-start gap-2">
                                    <span className="text-slate-400">•</span> {getScaledIngredient(ing)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {/* Feedback Form */}
                {index === steps.length - 1 && !submittedFeedback ? (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                     <h4 className="text-sm font-semibold text-slate-900">How was it?</h4>
                     <div className="flex gap-3">
                        <button
                          onClick={() => setFeedback({ ...feedback, liked: true })}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                            feedback.liked === true
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          👍 Yummy
                        </button>
                        <button
                          onClick={() => setFeedback({ ...feedback, liked: false })}
                          className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                            feedback.liked === false
                              ? 'bg-red-100 border-red-200 text-red-800'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          👎 Not for us
                        </button>
                     </div>
                     <textarea
                        value={feedback.notes}
                        onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                        placeholder="Any notes? (e.g. too salty, kids loved it)"
                        className="w-full rounded-lg border border-slate-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        rows={2}
                     />
                     <button
                        onClick={submitFeedback}
                        disabled={feedback.liked === null || submittingFeedback}
                        className="w-full py-2 rounded-full bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                     >
                        {submittingFeedback ? 'Sending...' : 'Save feedback'}
                     </button>
                  </div>
                ) : null}

                {submittedFeedback && (
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                        <p className="text-emerald-800 text-sm font-medium">Thanks for the feedback!</p>
                    </div>
                )}

                {/* Adaptation Controls */}
                {!adapting && !adaptationNote && (
                    <div className="flex flex-wrap gap-2">
                        {['lower_cost', 'vegetarian', 'no_oven', 'gluten_free'].map(opt => (
                            <button
                                key={opt}
                                onClick={() => handleAdapt(opt)}
                                className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                            >
                                ✨ {opt.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                )}
                
                <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={index === 0}
                  className="w-1/3 py-2 rounded-full border border-slate-200 text-slate-700 text-sm disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={index === steps.length - 1}
                  className="flex-1 py-2 rounded-full bg-slate-900 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {index === steps.length - 1 ? 'Done' : 'Next step'}
                </button>
                </div>
              </div>
            </article>
          </>
        ) : (
          <div className="flex-1 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-center px-6">
            <p className="text-sm text-slate-500">
              Choose a meal from the weekly planner to start cooking.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
