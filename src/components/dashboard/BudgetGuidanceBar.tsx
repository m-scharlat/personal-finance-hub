import { formatCurrency } from '../../lib/format'

export interface CategorySpend {
  category: string
  color: string
  currentMonth: number
  trailing3mo: number
}

interface Props {
  data: CategorySpend[]
  monthLabel: string
}

export default function BudgetGuidanceBar({ data, monthLabel }: Props) {
  const max = Math.max(...data.map(d => d.currentMonth), 1)
  const flagged = data.filter(d => d.trailing3mo > 0 && d.currentMonth > d.trailing3mo * 1.2)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">
          Spending by Category
        </p>
        <span className="text-[11px] text-ink-faint">{monthLabel}</span>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-ink-faint">No expense data this month.</p>
      ) : (
        <>
          {flagged.length > 0 && (
            <div className="mb-4 rounded-xl bg-amber-soft border border-amber/20 px-3 py-2.5">
              <p className="text-[12px] font-medium text-amber mb-1">
                {flagged.length === 1 ? '1 category running high' : `${flagged.length} categories running high`}
              </p>
              <p className="text-[11px] text-amber/80 leading-snug">
                {flagged.map(d => d.category).join(', ')} — more than usual this month
              </p>
            </div>
          )}

          <div className="space-y-3">
            {data.map(({ category, color, currentMonth, trailing3mo }) => {
              const isOver = trailing3mo > 0 && currentMonth > trailing3mo * 1.2
              const overBy = currentMonth - trailing3mo
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-[7px] h-[7px] rounded-full shrink-0"
                        style={{ backgroundColor: isOver ? 'var(--amber)' : color }}
                      />
                      <span className="text-[13.5px] text-ink truncate">{category}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {isOver && (
                        <span className="text-[11px] font-medium text-amber leading-none">
                          ↑ {formatCurrency(overBy)}
                        </span>
                      )}
                      <span className="text-[13.5px] font-medium num text-ink">
                        {formatCurrency(currentMonth)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full rounded-full bg-surface-alt overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(currentMonth / max) * 100}%`,
                        backgroundColor: isOver ? 'var(--amber)' : color,
                        opacity: 0.75,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
