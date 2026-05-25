import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import InfoTooltip from '../InfoTooltip'

const NEUTRAL = 'var(--ink-faint)'

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
  const [showAll, setShowAll]               = useState(false)
  const [sectionHovered, setSectionHovered] = useState(false)
  const [pinned, setPinned]                 = useState(false)
  const showColor = pinned || sectionHovered
  const truncated = limit && data.length > limit && !showAll
  const visible   = truncated ? data.slice(0, limit) : data
  const max       = Math.max(...visible.map(d => d.avgPerMonth), 1)

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">
          Spending by Category
        </p>
        <InfoTooltip text="Hover to reveal colors · Click to lock them in" />
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-ink-faint">No expense data in this period.</p>
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
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-[7px] h-[7px] rounded-full shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: showColor ? color : NEUTRAL }}
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
                      backgroundColor: showColor ? color : NEUTRAL,
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
