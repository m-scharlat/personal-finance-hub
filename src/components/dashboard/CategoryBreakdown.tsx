import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import InfoTooltip from '../InfoTooltip'

const NEUTRAL = '#9ca3af'  // gray-400 — works in both light and dark

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
  const [showAll, setShowAll]           = useState(false)
  const [sectionHovered, setSectionHovered] = useState(false)
  const [pinned, setPinned]             = useState(false)
  const showColor = pinned || sectionHovered
  const truncated = limit && data.length > limit && !showAll
  const visible = truncated ? data.slice(0, limit) : data
  const max = Math.max(...visible.map(d => d.avgPerMonth), 1)

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Spending by Category
        </p>
        <InfoTooltip text="Hover to reveal colors · Click to lock them in" />
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-600">No expense data in this period.</p>
      ) : (
        <>
        <div
          className="space-y-3 cursor-pointer"
          onMouseEnter={() => setSectionHovered(true)}
          onMouseLeave={() => setSectionHovered(false)}
          onClick={() => setPinned(p => !p)}
        >
          {visible.map(({ category, avgPerMonth, color }) => (
            <div key={category}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: showColor ? color : NEUTRAL }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{category}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white ml-3 shrink-0">
                  {formatCurrency(avgPerMonth)}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(avgPerMonth / max) * 100}%`, backgroundColor: showColor ? color : NEUTRAL }}
                />
              </div>
            </div>
          ))}
        </div>
        {limit && data.length > limit && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="mt-3 text-[11px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            {showAll ? 'Show less' : `Show all ${data.length} categories`}
          </button>
        )}
        </>
      )}
    </div>
  )
}
