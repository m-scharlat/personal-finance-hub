import {
  BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceArea,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, niceYAxis, formatYTick } from '../../lib/format'
import type { MonthlyTrendPoint } from '../../types'

const INCOME_COLOR  = 'var(--forest)'
const EXPENSE_COLOR = 'var(--red)'
const AXIS_COLOR    = 'var(--ink-faint)'
const GRID_COLOR    = 'var(--border)'

const now        = new Date()
const THIS_YEAR  = now.getFullYear()
const THIS_MONTH = now.getMonth() + 1

interface ChartPoint {
  label: string
  month: number
  income: number
  expenses: number
  isFuture: boolean
  isCurrent: boolean
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; payload: ChartPoint }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.isFuture) return null
  const net = d.income - d.expenses
  return (
    <div className="rounded-[10px] border border-border bg-surface shadow-card px-3 py-2.5 text-xs">
      <p className="font-medium text-ink-muted mb-2">{label}</p>
      {[
        { label: 'Income',   value: d.income,   color: INCOME_COLOR  },
        { label: 'Expenses', value: d.expenses, color: EXPENSE_COLOR },
      ].map(e => (
        <div key={e.label} className="flex items-center justify-between gap-6 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
            <span className="text-ink-muted">{e.label}</span>
          </div>
          <span className="font-semibold num" style={{ color: e.color }}>{formatCurrency(e.value)}</span>
        </div>
      ))}
      <div className="mt-1.5 pt-1.5 border-t border-border flex justify-between">
        <span className="text-ink-faint">Net</span>
        <span className={`font-semibold num ${net >= 0 ? 'text-forest' : 'text-red'}`}>
          {net >= 0 ? '+' : ''}{formatCurrency(net)}
        </span>
      </div>
    </div>
  )
}

function XTick(props: { x?: number | string; y?: number | string; payload?: { value: string }; isCurrent?: boolean }) {
  const { x = 0, y = 0, payload, isCurrent } = props
  return (
    <text x={Number(x)} y={Number(y)} dy={14} textAnchor="middle" fontSize={11}
      fontWeight={isCurrent ? 700 : 400}
      fill={isCurrent ? 'var(--terra)' : AXIS_COLOR}
    >
      {payload?.value}
    </text>
  )
}

interface Props { data: MonthlyTrendPoint[] }

export default function IncomeExpensesChart({ data }: Props) {
  const chartData: ChartPoint[] = data.map(d => {
    const isFuture = d.year > THIS_YEAR || (d.year === THIS_YEAR && d.month > THIS_MONTH)
    return {
      label:     d.label,
      month:     d.month,
      income:    isFuture ? 0 : d.income,
      expenses:  isFuture ? 0 : d.expenses,
      isFuture,
      isCurrent: d.year === THIS_YEAR && d.month === THIS_MONTH,
    }
  })

  const currentLabel = chartData.find(d => d.isCurrent)?.label

  const yMax = Math.max(...chartData.filter(d => !d.isFuture).map(d => Math.max(d.income, d.expenses)), 1)
  const { ticks: yTicks, domain: yDomain } = niceYAxis(yMax)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%" barGap={3}>
        <CartesianGrid strokeDasharray="0" stroke={GRID_COLOR} vertical={false} />
        <XAxis
          dataKey="label" axisLine={false} tickLine={false}
          tick={(props) => <XTick {...props} isCurrent={props.payload?.value === currentLabel} />}
        />
        <YAxis
          domain={yDomain}
          ticks={yTicks}
          tickFormatter={formatYTick}
          tick={{ fill: AXIS_COLOR, fontSize: 11 }}
          axisLine={false} tickLine={false} width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--terra-soft)' }} />
        {currentLabel && (
          <ReferenceArea x1={currentLabel} x2={currentLabel} fill="var(--terra-soft)" strokeOpacity={0} />
        )}
        <Bar dataKey="income" name="Income" radius={[3, 3, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={INCOME_COLOR} />
          ))}
        </Bar>
        <Bar dataKey="expenses" name="Expenses" radius={[3, 3, 0, 0]}>
          {chartData.map((_, i) => (
            <Cell key={i} fill={EXPENSE_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
