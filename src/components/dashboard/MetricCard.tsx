import InfoTooltip from '../InfoTooltip'

interface Props {
  label: string
  value: string
  subLabel?: string
  info?: string         // tooltip text shown on the (i) icon next to the label
  color?: 'green' | 'red' | 'indigo' | 'gray'
  delta?: string        // pre-formatted change, e.g. "↑ 12.3%" or "↓ $240"
  deltaGood?: boolean   // true = green, false = red
  deltaLabel?: string   // e.g. "vs 2024" or "vs Mar '24"
}

const VALUE_COLOR = {
  green:  'text-green-600 dark:text-green-400',
  red:    'text-red-600 dark:text-red-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  gray:   'text-gray-900 dark:text-white',
}

export default function MetricCard({ label, value, subLabel, info, color = 'gray', delta, deltaGood, deltaLabel }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        {info && <InfoTooltip text={info} />}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${VALUE_COLOR[color]}`}>{value}</p>
      {subLabel && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subLabel}</p>}
      {delta && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`text-xs font-medium tabular-nums ${
            deltaGood === true  ? 'text-green-500 dark:text-green-400' :
            deltaGood === false ? 'text-red-500 dark:text-red-400' :
                                  'text-gray-400 dark:text-gray-500'
          }`}>
            {delta}
          </span>
          {deltaLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
