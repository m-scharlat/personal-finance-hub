import { useState } from 'react'
import { formatCurrency } from '../../lib/format'

export interface CategoryAvg {
  category: string
  avgPerMonth: number
  color: string
}

interface Props {
  data: CategoryAvg[]
  limit?: number
}

export default function CategoryBreakdown({ data, limit }: Props) {
  const [showAll, setShowAll] = useState(false)
  const truncated = limit && data.length > limit && !showAll
  const visible   = truncated ? data.slice(0, limit) : data
  const max       = Math.max(...visible.map(d => d.avgPerMonth), 1)

  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-3">
        Spending by Category
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-ink-faint">No expense data in this period.</p>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map(({ category, avgPerMonth, color }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[13.5px] text-ink truncate">{category}</span>
                  </div>
                  <span className="text-[13.5px] font-medium num text-ink ml-3 shrink-0">
                    {formatCurrency(avgPerMonth)}
                  </span>
                </div>
                <div className="h-1 w-full rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(avgPerMonth / max) * 100}%`,
                      backgroundColor: color,
                      opacity: 0.75,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {limit && data.length > limit && (
            <button
              onClick={() => setShowAll(v => !v)}
              className="mt-3 text-[11px] text-terra hover:opacity-70 transition-opacity"
            >
              {showAll ? 'Show less' : `Show all ${data.length} categories`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
