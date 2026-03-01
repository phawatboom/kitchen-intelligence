import { useState } from 'react'

export type HouseholdProfile = {
  location: string
  familySize: number
  equipment: string[]
  nutritionGoal: 'balanced' | 'higher_protein' | 'budget_friendly'
  is_vegetarian?: boolean
  is_gluten_free?: boolean
  enable_leftovers?: boolean
  avoids_ingredients: string[]
}

type HouseholdPanelProps = {
  value: HouseholdProfile
  onChange: (value: HouseholdProfile) => void
  onClose: () => void
}

const EQUIPMENT_OPTIONS = ['oven', 'hob', 'microwave', 'slow_cooker'] as const

export function HouseholdPanel({ value, onChange, onClose }: HouseholdPanelProps) {
  const [draft, setDraft] = useState<HouseholdProfile>(value)

  const toggleEquipment = (item: string) => {
    setDraft((prev) => {
      const has = prev.equipment.includes(item)
      return {
        ...prev,
        equipment: has
          ? prev.equipment.filter((e) => e !== item)
          : [...prev.equipment, item],
      }
    })
  }

  const apply = () => {
    onChange(draft)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Household profile</h2>
            <p className="text-xs text-slate-500">We use this to tailor recipes and cost.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <label className="block text-slate-600">Location</label>
            <input
              type="text"
              value={draft.location}
              onChange={(e) => setDraft({ ...draft, location: e.target.value })}
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="e.g. London, UK"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Family size</label>
            <input
              type="number"
              min={1}
              max={10}
              value={draft.familySize}
              onChange={(e) =>
                setDraft({ ...draft, familySize: Number(e.target.value) || 1 })
              }
              className="w-24 rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Available equipment</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map((item) => {
                const active = draft.equipment.includes(item)
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleEquipment(item)}
                    className={`px-2 py-1 rounded-full border text-xs transition ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item.replace('_', ' ')}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Preferences</label>
            <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                    type="checkbox"
                    checked={draft.enable_leftovers || false}
                    onChange={(e) => setDraft({ ...draft, enable_leftovers: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-700">Eat leftovers for lunch (Save time & $)</span>
                </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Dietary Restrictions</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_vegetarian || false}
                  onChange={(e) => setDraft({ ...draft, is_vegetarian: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-slate-700">Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.is_gluten_free || false}
                  onChange={(e) => setDraft({ ...draft, is_gluten_free: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-slate-700">Gluten-free</span>
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600">Avoid ingredients</label>
            <input
              type="text"
              value={draft.avoids_ingredients.join(', ')}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  avoids_ingredients: e.target.value
                    .split(',')
                    .map((s) => s.trim().toLowerCase())
                    .filter(Boolean),
                })
              }
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="e.g. peanuts, shellfish"
            />
          </div>

          <div className="space-y-1">
            <select
              value={draft.nutritionGoal}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  nutritionGoal: e.target
                    .value as HouseholdProfile['nutritionGoal'],
                })
              }
              className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="balanced">Balanced</option>
              <option value="higher_protein">Higher protein</option>
              <option value="budget_friendly">Budget friendly</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-xs sm:text-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-slate-800"
          >
            Save & regenerate
          </button>
        </div>
      </div>
    </div>
  )
}
