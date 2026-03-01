import { useState, useEffect } from 'react'

type GroceryListProps = {
  ingredients: string[]
}

export function GroceryList({ ingredients }: GroceryListProps) {
  // Initialize from localStorage if available
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('grocery-checked')
    if (saved) {
      try {
        return new Set(JSON.parse(saved))
      } catch (e) {
        return new Set()
      }
    }
    return new Set()
  })

  // Smart Sorting State
  const [categories, setCategories] = useState<Record<string, string[]> | null>(null)
  const [sorting, setSorting] = useState(false)

  // Persist to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('grocery-checked', JSON.stringify(Array.from(checkedItems)))
  }, [checkedItems])

  // Reset categories if ingredients change significantly (simple check length)
  useEffect(() => {
      setCategories(null)
  }, [ingredients.length])

  const toggleItem = (item: string) => {
    const next = new Set(checkedItems)
    if (next.has(item)) {
      next.delete(item)
    } else {
      next.add(item)
    }
    setCheckedItems(next)
  }

  // Clear checked items
  const clearChecked = () => {
    if (confirm('Uncheck all items?')) {
        setCheckedItems(new Set())
    }
  }

  const handleSort = async () => {
      if (ingredients.length === 0) return
      setSorting(true)
      try {
          const res = await fetch('/api/llm/categorize-groceries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: ingredients }),
          })
          if (!res.ok) throw new Error('Sort failed')
          const data = await res.json()
          setCategories(data.categories)
      } catch (e) {
          console.error(e)
          alert("Couldn't sort list right now.")
      } finally {
          setSorting(false)
      }
  }

  return (
    <section aria-label="Grocery List" className="max-w-xl mx-auto space-y-4 h-full flex flex-col">
      <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Grocery List</h2>
            <p className="text-sm text-slate-500">
                {ingredients.length} items from your weekly plan.
            </p>
          </div>
          <div className="flex gap-3">
            {checkedItems.size > 0 && (
                <button 
                    onClick={clearChecked}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                    Reset
                </button>
            )}
            {!categories && ingredients.length > 0 && (
                <button
                    onClick={handleSort}
                    disabled={sorting}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 disabled:opacity-50"
                >
                    {sorting ? 'Sorting...' : '✨ Smart Sort'}
                </button>
            )}
          </div>
      </header>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1 p-2 space-y-1">
          {ingredients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
                <p>Your list is empty.</p>
                <p className="text-xs">Plan some meals to see ingredients here.</p>
            </div>
          ) : categories ? (
              // Categorized View
              <div className="space-y-4 p-2">
                  {Object.entries(categories).map(([category, items]) => (
                      <div key={category}>
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{category}</h3>
                          <div className="space-y-1">
                              {items.map(item => (
                                  <GroceryItem 
                                    key={item} 
                                    item={item} 
                                    isChecked={checkedItems.has(item)} 
                                    onToggle={() => toggleItem(item)} 
                                  />
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
            // Flat View
            ingredients.map((item) => (
              <GroceryItem 
                key={item} 
                item={item} 
                isChecked={checkedItems.has(item)} 
                onToggle={() => toggleItem(item)} 
              />
            ))
          )}
        </div>
        
        {/* Progress Bar */}
        {ingredients.length > 0 && (
             <div className="bg-slate-50 border-t border-slate-100 p-3 flex items-center gap-3">
                 <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-slate-900 transition-all duration-500"
                        style={{ width: `${(checkedItems.size / ingredients.length) * 100}%` }}
                     />
                 </div>
                 <span className="text-xs font-medium text-slate-600">
                     {checkedItems.size}/{ingredients.length}
                 </span>
             </div>
        )}
      </div>
    </section>
  )
}

// Helper Component for consistent rendering
function GroceryItem({ item, isChecked, onToggle }: { item: string, isChecked: boolean, onToggle: () => void }) {
    return (
        <label
          className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer select-none ${
            isChecked
              ? 'bg-slate-50 border-transparent'
              : 'bg-white border-slate-100 hover:bg-slate-50'
          }`}
        >
          <div className={`w-5 h-5 rounded flex items-center justify-center border transition ${
              isChecked ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-300'
          }`}>
              {isChecked && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
              )}
          </div>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={onToggle}
            className="hidden"
          />
          <span
            className={`text-sm font-medium transition ${
              isChecked ? 'text-slate-400 line-through' : 'text-slate-700'
            }`}
          >
            {item}
          </span>
        </label>
    )
}
