interface Props {
  label: string
  value: string
  subLabel?: string
  color?: 'green' | 'red' | 'indigo' | 'gray'
}

const VALUE_COLOR = {
  green:  'text-green-600 dark:text-green-400',
  red:    'text-red-600 dark:text-red-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  gray:   'text-gray-900 dark:text-white',
}

export default function MetricCard({ label, value, subLabel, color = 'gray' }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${VALUE_COLOR[color]}`}>{value}</p>
      {subLabel && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{subLabel}</p>}
    </div>
  )
}
