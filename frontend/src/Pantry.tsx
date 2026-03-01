import { useState } from 'react'

type PantryProps = {
  items: string[]
  onAdd: (item: string) => void
  onRemove: (item: string) => void
  loading: boolean
}

export function Pantry({ items, onAdd, onRemove, loading }: PantryProps) {
  const [newItem, setNewItem] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.trim()) return
    onAdd(newItem.trim())
    setNewItem('')
  }

  // Common pantry suggestions
  const suggestions = ['Pasta', 'Rice', 'Canned Tomatoes', 'Olive Oil', 'Garlic', 'Onions', 'Beans', 'Lentils']

  return (
    <section aria-label="Pantry Inventory" className="max-w-xl mx-auto space-y-6">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Your Pantry</h2>
        <p className="text-sm text-slate-500">
          Add what you have at home. We'll prioritize recipes that use these ingredients.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add an item (e.g. Rice)"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button
          type="submit"
          disabled={!newItem.trim()}
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Suggestions</h3>
        <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
                <button
                    key={s}
                    onClick={() => { onAdd(s); }} 
                    className="text-xs px-2 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                >
                    + {s}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loading && items.length === 0 ? (
           <p className="text-sm text-slate-400 text-center">Loading pantry...</p>
        ) : items.length === 0 ? (
           <div className="text-center py-6">
               <p className="text-slate-500 text-sm">Your pantry is empty.</p>
               <p className="text-xs text-slate-400 mt-1">Add items to help us optimize your plan.</p>
           </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm group"
              >
                {item}
                <button
                  onClick={() => onRemove(item)}
                  className="text-slate-400 hover:text-red-600 focus:outline-none"
                  aria-label={`Remove ${item}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
