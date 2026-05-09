import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../lib/format'
import type { MonthlyTrendPoint } from '../../types'

const INCOME_COLOR      = '#4ade80'
const EXPENSE_COLOR     = '#f87171'
const SAVINGS_COLOR     = '#818cf8'
const PLACEHOLDER_COLOR = '#94a3b8'
const AXIS_COLOR        = '#9ca3af'
const GRID_COLOR        = 'rgba(148,163,184,0.10)'

const now        = new Date()
const THIS_YEAR  = now.getFullYear()
const THIS_MONTH = now.getMonth() + 1

interface StackedPoint {
  label: string
  year: number
  month: number
  income: number
  expenses: number
  savings: number
  placeholder: number
  incomeRaw: number
  expensesRaw: number
  savingsRaw: number
  hasData: boolean
  isFuture: boolean
  isCurrent: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: StackedPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload

  if (!d.hasData) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2.5 text-xs">
        <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</p>
        <p className="text-gray-400 dark:text-gray-500">
          {d.isFuture ? 'No data yet' : 'No transactions'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2.5 text-xs">
      <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">
        {label}
        {d.isFuture && (
          <span className="ml-1.5 font-normal text-gray-400 dark:text-gray-500">(partial)</span>
        )}
      </p>
      {[
        { color: INCOME_COLOR,  label: 'Income',   pct: d.income,   raw: d.incomeRaw   },
        { color: EXPENSE_COLOR, label: 'Expenses', pct: d.expenses, raw: d.expensesRaw },
        { color: SAVINGS_COLOR, label: 'Savings',  pct: d.savings,  raw: d.savingsRaw  },
      ].map((entry) => (
        <div key={entry.label} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{entry.label}</span>
          </div>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {formatCurrency(entry.raw)} ({entry.pct.toFixed(1)}%)
          </span>
        </div>
      ))}
    </div>
  )
}

function XTick(props: { x?: number; y?: number; payload?: { value: string }; isCurrent?: boolean }) {
  const { x = 0, y = 0, payload, isCurrent } = props
  return (
    <text
      x={x} y={y} dy={14}
      textAnchor="middle"
      fontSize={11}
      fontWeight={isCurrent ? 700 : 400}
      fill={isCurrent ? '#818cf8' : AXIS_COLOR}
    >
      {payload?.value}
    </text>
  )
}

interface Props {
  data: MonthlyTrendPoint[]
}

export default function MonthlyTrendsChart({ data }: Props) {
  const stackedData: StackedPoint[] = data.map((d) => {
    const isFuture  = d.year > THIS_YEAR || (d.year === THIS_YEAR && d.month > THIS_MONTH)
    const isCurrent = d.year === THIS_YEAR && d.month === THIS_MONTH
    const hasData   = d.income > 0 || d.expenses > 0 || d.savings > 0

    if (!hasData) {
      return {
        label: d.label, year: d.year, month: d.month,
        income: 0, expenses: 0, savings: 0, placeholder: 100,
        incomeRaw: 0, expensesRaw: 0, savingsRaw: 0,
        hasData: false, isFuture, isCurrent,
      }
    }

    const total = Math.abs(d.income) + Math.abs(d.expenses) + Math.abs(d.savings)
    return {
      label: d.label, year: d.year, month: d.month,
      income:   (Math.abs(d.income)   / total) * 100,
      expenses: (Math.abs(d.expenses) / total) * 100,
      savings:  (Math.abs(d.savings)  / total) * 100,
      placeholder: 0,
      incomeRaw: d.income, expensesRaw: d.expenses, savingsRaw: d.savings,
      hasData: true, isFuture, isCurrent,
    }
  })

  const currentLabel = stackedData.find(d => d.isCurrent)?.label

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={stackedData}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            {/* Only 3 horizontal bands — enough to orient, not enough to clutter */}
            <CartesianGrid
              strokeDasharray="0"
              stroke={GRID_COLOR}
              vertical={false}
              horizontalValues={[33, 66]}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={(props) => (
                <XTick {...props} isCurrent={props.payload?.value === currentLabel} />
              )}
            />

            {/* No Y-axis labels — 100% stacked bars make the scale self-evident */}
            <YAxis hide domain={[0, 100]} />

            {/* Soft midpoint reference */}
            <ReferenceLine
              y={50}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.07)' }} />

            {/* Soft column behind the current month */}
            {currentLabel && (
              <ReferenceArea
                x1={currentLabel} x2={currentLabel}
                fill="rgba(129,140,248,0.07)"
                strokeOpacity={0}
              />
            )}

            <Bar dataKey="placeholder" stackId="s" radius={[3, 3, 3, 3]}>
              {stackedData.map((entry, i) => (
                <Cell key={i} fill={PLACEHOLDER_COLOR} fillOpacity={entry.isFuture ? 0.12 : 0.22} />
              ))}
            </Bar>
            <Bar dataKey="income" name="Income" stackId="s" radius={[0, 0, 2, 2]}>
              {stackedData.map((entry, i) => (
                <Cell key={i} fill={INCOME_COLOR} fillOpacity={entry.isFuture ? 0.38 : 1} />
              ))}
            </Bar>
            <Bar dataKey="expenses" name="Expenses" stackId="s" radius={[0, 0, 0, 0]}>
              {stackedData.map((entry, i) => (
                <Cell key={i} fill={EXPENSE_COLOR} fillOpacity={entry.isFuture ? 0.38 : 1} />
              ))}
            </Bar>
            <Bar dataKey="savings" name="Savings" stackId="s" radius={[3, 3, 0, 0]}>
              {stackedData.map((entry, i) => (
                <Cell key={i} fill={SAVINGS_COLOR} fillOpacity={entry.isFuture ? 0.38 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        {[
          { color: INCOME_COLOR,  label: 'Income'   },
          { color: EXPENSE_COLOR, label: 'Expenses' },
          { color: SAVINGS_COLOR, label: 'Savings'  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
