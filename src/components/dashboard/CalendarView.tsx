import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '../../lib/format'
import type { MonthlyTrendPoint } from '../../types'

const now       = new Date()
const thisMonth = now.getMonth() + 1
const thisYear  = now.getFullYear()

interface Props {
  data: MonthlyTrendPoint[]
  year: number
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className="mt-0.5 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-700/60 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default function CalendarView({ data, year }: Props) {
  const navigate    = useNavigate()
  const maxIncome   = Math.max(...data.map(d => d.income),   1)
  const maxExpenses = Math.max(...data.map(d => d.expenses), 1)
  const maxSavings  = Math.max(...data.map(d => d.savings),  1)

  return (
    <div>
      {/* Color key */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
        {[
          { color: 'bg-indigo-300 dark:bg-indigo-600', label: 'This month'   },
          { color: 'bg-green-300 dark:bg-green-600',   label: 'In the green' },
          { color: 'bg-red-300 dark:bg-red-600',       label: 'In the red'   },
          { color: 'bg-gray-300 dark:bg-gray-600',     label: 'No data'      },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full shrink-0 opacity-60 ${color}`} />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{label}</span>
          </div>
        ))}
      </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {data.map((point) => {
        const isFuture  = year === thisYear && point.month > thisMonth
        const isCurrent = year === thisYear && point.month === thisMonth
        const hasData   = point.income > 0 || point.expenses > 0 || point.savings > 0
        const netFlow   = point.income - point.expenses
        const surplus   = !isFuture && hasData && netFlow >= 0
        const deficit   = !isFuture && hasData && netFlow < 0

        return (
          <div
            key={point.month}
            onClick={hasData && !isFuture ? () => navigate(`/tracker?year=${year}&month=${point.month}`) : undefined}
            className={`rounded-xl border p-3.5 transition-all duration-150 min-h-[130px] flex flex-col ${hasData && !isFuture ? 'cursor-pointer' : 'cursor-default'} ${
              isCurrent
                ? 'border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/20 hover:shadow-md hover:-translate-y-px'
                : isFuture
                ? 'border-dashed border-gray-300/70 dark:border-gray-600/50 bg-gray-50/30 dark:bg-gray-800/10 opacity-60'
                : surplus
                ? 'border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-950/10 hover:shadow-md hover:-translate-y-px'
                : deficit
                ? 'border-red-100 dark:border-red-900/30 bg-red-50/20 dark:bg-red-950/10 hover:shadow-md hover:-translate-y-px'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-800/20 hover:shadow-md hover:-translate-y-px'
            }`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-2.5">
<p className={`text-[11px] font-bold uppercase tracking-wide ${
                isCurrent ? 'text-indigo-500 dark:text-indigo-400'
                : isFuture ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-400 dark:text-gray-500'
              }`}>
                {point.label}
              </p>
              {hasData && !isFuture && (
                <p className={`text-[11px] font-bold tabular-nums ${
                  netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
                }`}>
                  {netFlow >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netFlow))}
                </p>
              )}
            </div>

            {/* Content */}
            {isFuture ? (
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">—</p>
            ) : !hasData ? (
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">—</p>
            ) : (
              <div className="space-y-2">
                {/* Income */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">Income</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-green-600 dark:text-green-400">
                      {formatCurrency(point.income)}
                    </span>
                  </div>
                  <MiniBar value={point.income} max={maxIncome} color="#4ade80" />
                </div>

                {/* Expenses */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">Expenses</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-red-500 dark:text-red-400">
                      {formatCurrency(point.expenses)}
                    </span>
                  </div>
                  <MiniBar value={point.expenses} max={maxExpenses} color="#f87171" />
                </div>

                {/* Savings */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">Savings</span>
                    </div>
                    <span className="text-[11px] font-semibold tabular-nums text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(point.savings)}
                    </span>
                  </div>
                  <MiniBar value={point.savings} max={maxSavings} color="#818cf8" />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
    </div>
  )
}
