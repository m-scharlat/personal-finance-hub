import { formatCurrency } from '../../lib/format'

interface CategoryRow {
  category: string
  monthlyRate: number
}

interface Props {
  committed: number
  avgMonthlyIncome: number
  committedByCategory: CategoryRow[]
  categoryColorMap: Record<string, string>
}

export default function RecurringVsOneOffBar({ committed, avgMonthlyIncome, committedByCategory, categoryColorMap }: Props) {
  const burdenPct = avgMonthlyIncome > 0 ? (committed / avgMonthlyIncome) * 100 : null

  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-4">
        Recurring Expenses
      </p>

      {committed === 0 ? (
        <p className="text-sm text-ink-faint">No recurring expenses on record.</p>
      ) : (
        <>
          {/* Headline */}
          <div className="mb-1">
            <span className="text-2xl font-bold tabular-nums text-ink">
              {formatCurrency(committed)}
            </span>
            <span className="ml-1.5 text-sm text-ink-muted">/mo committed</span>
          </div>
          {burdenPct !== null && (
            <p className="text-xs text-ink-faint">
              {burdenPct.toFixed(0)}% of avg monthly income
            </p>
          )}

          {/* Category list */}
          {committedByCategory.length > 0 && (
            <div className="mt-5 space-y-2.5">
              {committedByCategory.map(({ category, monthlyRate }) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="w-[7px] h-[7px] rounded-full shrink-0"
                      style={{ backgroundColor: categoryColorMap[category] ?? 'var(--ink-faint)' }}
                    />
                    <span className="text-[13px] text-ink truncate">{category}</span>
                  </div>
                  <span className="text-[13px] font-medium num text-ink ml-3 shrink-0">
                    {formatCurrency(monthlyRate)}<span className="font-normal text-ink-muted">/mo</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
