export type HealthScoreProps = {
  score: number
  tags?: string[]
}

export function HealthScore({ score, tags = [] }: HealthScoreProps) {
  const clamped = Math.max(0, Math.min(100, score))

  return (
    <div className="flex flex-col gap-1 text-xs sm:text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">Health score</span>
        <span className="font-semibold text-slate-800">{clamped}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[0.65rem] sm:text-[0.7rem]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
