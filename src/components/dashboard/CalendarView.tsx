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
    <div className="mt-0.5 h-1 w-full rounded-full bg-surface-alt overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export default function CalendarView({ data, year }: Props) {
  const navigate    = useNavigate()
  const maxIncome   = Math.max(...data.map(d => d.income),   1)
  const maxExpenses = Math.max(...data.map(d => d.expenses), 1)
  const maxSavings  = Math.max(...data.map(d => d.savings),  1)

  const KEY = [
    { color: 'var(--terra)',        label: 'This month'   },
    { color: 'var(--forest)',       label: 'In the green' },
    { color: 'var(--red)',          label: 'In the red'   },
    { color: 'var(--border-strong)', label: 'No data'     },
  ]

  return (
    <div>
      {/* Color key */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4">
        {KEY.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0 opacity-70" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-ink-faint">{label}</span>
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
              className={`rounded-xl border p-3.5 transition-all duration-150 min-h-[130px] flex flex-col ${
                hasData && !isFuture ? 'cursor-pointer hover:shadow-md hover:-translate-y-px' : 'cursor-default'
              } ${
                isCurrent ? 'border-terra'
                : isFuture ? 'border-dashed border-border opacity-60'
                : 'border-border'
              }`}
              style={
                isCurrent ? { background: 'var(--terra-soft)' }
                : surplus  ? { background: 'var(--forest-soft)' }
                : deficit  ? { background: 'var(--red-soft)' }
                : hasData  ? undefined
                : { background: 'var(--surface-alt)' }
              }
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-2.5">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${
                  isCurrent ? 'text-terra'
                  : isFuture ? 'text-ink-faint'
                  : 'text-ink-faint'
                }`}>
                  {point.label}
                </p>
                {hasData && !isFuture && (
                  <p className={`text-[11px] font-bold num ${
                    netFlow >= 0 ? 'text-forest' : 'text-red'
                  }`}>
                    {netFlow >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netFlow))}
                  </p>
                )}
              </div>

              {/* Content */}
              {isFuture ? (
                <p className="text-xs text-ink-faint mt-1">—</p>
              ) : !hasData ? (
                <p className="text-xs text-ink-faint mt-1">—</p>
              ) : (
                <div className="space-y-2">
                  {/* Income */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--forest)' }} />
                        <span className="text-[10px] text-ink-faint">Income</span>
                      </div>
                      <span className="text-[11px] font-semibold num text-forest">
                        {formatCurrency(point.income)}
                      </span>
                    </div>
                    <MiniBar value={point.income} max={maxIncome} color="var(--forest)" />
                  </div>

                  {/* Expenses */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--red)' }} />
                        <span className="text-[10px] text-ink-faint">Expenses</span>
                      </div>
                      <span className="text-[11px] font-semibold num text-red">
                        {formatCurrency(point.expenses)}
                      </span>
                    </div>
                    <MiniBar value={point.expenses} max={maxExpenses} color="var(--red)" />
                  </div>

                  {/* Savings */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: 'var(--terra)' }} />
                        <span className="text-[10px] text-ink-faint">Net Savings</span>
                      </div>
                      <span className="text-[11px] font-semibold num text-terra">
                        {formatCurrency(point.savings)}
                      </span>
                    </div>
                    <MiniBar value={point.savings} max={maxSavings} color="var(--terra)" />
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
