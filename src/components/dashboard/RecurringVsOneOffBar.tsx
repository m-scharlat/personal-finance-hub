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
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        Recurring Expenses
      </p>

      {committed === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-600">No recurring expenses on record.</p>
      ) : (
        <>
          {/* Headline */}
          <div className="mb-1">
            <span className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">
              {formatCurrency(committed)}
            </span>
            <span className="ml-1.5 text-sm text-gray-400 dark:text-gray-500">/mo committed</span>
          </div>
          {burdenPct !== null && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
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
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: categoryColorMap[category] ?? '#9ca3af' }}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{category}</span>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-gray-900 dark:text-white ml-3 shrink-0">
                    {formatCurrency(monthlyRate)}<span className="font-normal text-gray-400 dark:text-gray-500">/mo</span>
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
