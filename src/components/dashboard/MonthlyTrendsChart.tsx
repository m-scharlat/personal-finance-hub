import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '../../lib/format'
import type { MonthlyTrendPoint } from '../../types'

const INCOME_COLOR  = '#4ade80'
const EXPENSE_COLOR = '#f87171'
const SAVINGS_COLOR = '#818cf8'
const AXIS_COLOR    = '#9ca3af'
const GRID_COLOR    = 'rgba(148,163,184,0.12)'

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2.5 text-xs">
      <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
          </div>
          <span className="font-semibold tabular-nums" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface Props {
  data: MonthlyTrendPoint[]
}

export default function MonthlyTrendsChart({ data }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={INCOME_COLOR}  stopOpacity={0.25} />
              <stop offset="100%" stopColor={INCOME_COLOR}  stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={EXPENSE_COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={SAVINGS_COLOR} stopOpacity={0.25} />
              <stop offset="100%" stopColor={SAVINGS_COLOR} stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => v >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`}
            tick={{ fill: AXIS_COLOR, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }}
          />
          <Area
            type="monotone" dataKey="income" name="Income"
            stroke={INCOME_COLOR} strokeWidth={2.5}
            fill="url(#incomeGrad)"
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone" dataKey="expenses" name="Expenses"
            stroke={EXPENSE_COLOR} strokeWidth={2.5}
            fill="url(#expenseGrad)"
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone" dataKey="savings" name="Savings"
            stroke={SAVINGS_COLOR} strokeWidth={2.5}
            fill="url(#savingsGrad)"
            dot={false} activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        {[
          { color: INCOME_COLOR,  label: 'Income'   },
          { color: EXPENSE_COLOR, label: 'Expenses' },
          { color: SAVINGS_COLOR, label: 'Savings'  },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded-full shrink-0" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
