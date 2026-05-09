import InfoTooltip from '../InfoTooltip'

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const MIN_YEAR    = 2020
const now         = new Date()
const currentYear  = now.getFullYear()
const currentMonth = now.getMonth() + 1

interface Props {
  year: number
  month: number | null
  onYearChange: (year: number) => void
  onMonthChange: (month: number | null) => void
}

export default function YearMonthSelector({ year, month, onYearChange, onMonthChange }: Props) {
  const isCurrentYear = year === currentYear

  return (
    <div className="flex items-center gap-2">
      {/* Year navigator */}
      <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden">
        <button
          onClick={() => onYearChange(year - 1)}
          disabled={year <= MIN_YEAR}
          className="px-2.5 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous year"
        >
          ‹
        </button>
        <span className="px-2 text-sm font-semibold text-gray-900 dark:text-white tabular-nums min-w-[3rem] text-center select-none">
          {year}
        </span>
        <button
          onClick={() => onYearChange(year + 1)}
          disabled={year >= currentYear}
          className="px-2.5 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next year"
        >
          ›
        </button>
      </div>

      {/* Month selector */}
      <select
        value={month ?? ''}
        onChange={e => onMonthChange(e.target.value === '' ? null : Number(e.target.value))}
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
      >
        <option value="">Full Year</option>
        {MONTH_NAMES.map((name, i) => {
          const m = i + 1
          return (
            <option key={m} value={m} disabled={isCurrentYear && m > currentMonth}>
              {name}
            </option>
          )
        })}
      </select>

      <InfoTooltip
        text="Month selection filters the metrics row only — Trends always show the full selected year"
        align="left"
      />
    </div>
  )
}
