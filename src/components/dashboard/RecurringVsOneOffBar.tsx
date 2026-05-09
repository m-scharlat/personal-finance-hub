import { useState } from 'react'
import { formatCurrency } from '../../lib/format'
import InfoTooltip from '../InfoTooltip'

const RECURRING_COLOR = '#0ea5e9'
const ONEOFF_COLOR    = '#f97066'
const NEUTRAL         = '#9ca3af'

interface Props {
  recurring: number
  oneOff: number
}

export default function RecurringVsOneOffBar({ recurring, oneOff }: Props) {
  const [sectionHovered, setSectionHovered] = useState(false)
  const [pinned, setPinned]                 = useState(false)
  const showColor = pinned || sectionHovered

  const total        = recurring + oneOff
  const recurringPct = total > 0 ? (recurring / total) * 100 : 0
  const oneOffPct    = 100 - recurringPct

  const recurringColor = showColor ? RECURRING_COLOR : NEUTRAL
  const oneOffColor    = showColor ? ONEOFF_COLOR    : NEUTRAL

  return (
    <div
      className="cursor-pointer"
      onMouseEnter={() => setSectionHovered(true)}
      onMouseLeave={() => setSectionHovered(false)}
      onClick={() => setPinned(p => !p)}
    >
      <div className="flex items-center gap-1.5 mb-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Expense Breakdown
        </p>
        <InfoTooltip text="Hover to reveal colors · Click to lock them in" />
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-600 py-4">No expenses in this period.</p>
      ) : (
        <>
          {/* Two-segment bar */}
          <div className="h-3 rounded-full overflow-hidden flex">
            <div
              className="h-full transition-colors duration-300"
              style={{ width: `${recurringPct}%`, backgroundColor: recurringColor }}
            />
            <div
              className="h-full transition-colors duration-300"
              style={{ width: `${oneOffPct}%`, backgroundColor: oneOffColor }}
            />
          </div>

          {/* Legend rows */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                  style={{ backgroundColor: recurringColor }}
                />
                <span className="text-gray-600 dark:text-gray-400">Recurring</span>
              </div>
              <div className="flex items-center gap-2.5 tabular-nums">
                <span className="text-xs text-gray-400 dark:text-gray-500">{recurringPct.toFixed(0)}%</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(recurring)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                  style={{ backgroundColor: oneOffColor }}
                />
                <span className="text-gray-600 dark:text-gray-400">One-off</span>
              </div>
              <div className="flex items-center gap-2.5 tabular-nums">
                <span className="text-xs text-gray-400 dark:text-gray-500">{oneOffPct.toFixed(0)}%</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(oneOff)}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total</span>
              <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{formatCurrency(total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
