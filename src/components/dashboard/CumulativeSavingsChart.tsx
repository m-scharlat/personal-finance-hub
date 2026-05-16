import { useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, niceYAxis, formatYTick } from '../../lib/format'
import InfoTooltip from '../InfoTooltip'
import type { MonthlyTrendPoint } from '../../types'

const SAVINGS_COLOR   = '#818cf8'
const NET_COLOR       = '#14b8a6'
const AXIS_COLOR      = '#9ca3af'
const GRID_COLOR      = 'rgba(148,163,184,0.10)'

const now        = new Date()
const THIS_YEAR  = now.getFullYear()
const THIS_MONTH = now.getMonth() + 1

interface ChartPoint {
  label: string
  cumulative: number | null
  netSavings: number | null
}

function CustomTooltip({ active, payload, label, showNet }: {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number | null; payload: ChartPoint }>
  label?: string
  showNet: boolean
}) {
  if (!active || !payload?.length) return null

  // Read both values from the raw data point regardless of which Area is rendered
  const point      = payload[0].payload
  const savings    = point.cumulative
  const netSavings = point.netSavings

  if (showNet) {
    if (netSavings == null) return null
    const unlogged = savings != null && netSavings > savings ? netSavings - savings : null
    const hasBreakdown = savings != null || unlogged != null
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2.5 text-xs">
        <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</p>
        {/* Total */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: NET_COLOR }} />
            <span className="text-gray-500 dark:text-gray-400">Net savings</span>
          </div>
          <span className="font-semibold tabular-nums" style={{ color: NET_COLOR }}>{formatCurrency(netSavings)}</span>
        </div>
        {/* Breakdown — indented to show these are components of net, not subtractions */}
        {hasBreakdown && (
          <div className="mt-1.5 ml-1.5 pl-2.5 border-l-2 border-gray-100 dark:border-gray-700 space-y-1">
            {savings != null && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SAVINGS_COLOR }} />
                  <span className="text-gray-500 dark:text-gray-400">Logged</span>
                </div>
                <span className="font-semibold tabular-nums" style={{ color: SAVINGS_COLOR }}>{formatCurrency(savings)}</span>
              </div>
            )}
            {unlogged != null && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-gray-300 dark:bg-gray-600" />
                  <span className="text-gray-400 dark:text-gray-500">Unlogged</span>
                </div>
                <span className="tabular-nums text-gray-400 dark:text-gray-500">{formatCurrency(unlogged)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (savings == null) return null
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg px-3 py-2.5 text-xs">
      <p className="font-medium text-gray-600 dark:text-gray-300 mb-2">{label}</p>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SAVINGS_COLOR }} />
          <span className="text-gray-500 dark:text-gray-400">Logged savings</span>
        </div>
        <span className="font-semibold tabular-nums" style={{ color: SAVINGS_COLOR }}>{formatCurrency(savings)}</span>
      </div>
    </div>
  )
}

function XTick(props: { x?: number | string; y?: number | string; payload?: { value: string }; isCurrent?: boolean }) {
  const { x = 0, y = 0, payload, isCurrent } = props
  return (
    <text x={Number(x)} y={Number(y)} dy={14} textAnchor="middle" fontSize={11}
      fontWeight={isCurrent ? 700 : 400}
      fill={isCurrent ? '#c4b09a' : AXIS_COLOR}
    >
      {payload?.value}
    </text>
  )
}

interface Props { data: MonthlyTrendPoint[] }

export default function CumulativeSavingsChart({ data }: Props) {
  const [showNet, setShowNet] = useState(true)

  const currentLabel = data.find(d => d.year === THIS_YEAR && d.month === THIS_MONTH)?.label

  let runningSavings = 0
  let runningNet     = 0
  const chartData: ChartPoint[] = data.map(d => {
    const isFuture = d.year > THIS_YEAR || (d.year === THIS_YEAR && d.month > THIS_MONTH)
    if (isFuture) return { label: d.label, cumulative: null, netSavings: null }
    runningSavings += d.savings
    runningNet     += d.income - d.expenses
    return { label: d.label, cumulative: runningSavings, netSavings: runningNet }
  })

  // Y-axis scales to the active series only; snapped to clean intervals
  const yMax = Math.max(...chartData.map(d => (showNet ? d.netSavings : d.cumulative) ?? 0), 1)
  const { ticks: yTicks, domain: yDomain } = niceYAxis(yMax)

  const glowColor  = showNet ? `rgba(20,184,166,0.45)` : `rgba(129,140,248,0.45)`
  const trackColor = showNet ? NET_COLOR : SAVINGS_COLOR

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {showNet ? 'Cumulative Net Savings' : 'Cumulative Savings'}
          </p>
          <InfoTooltip text={showNet
            ? 'Net savings = income minus expenses. Logged savings are a named portion of that total — hover to see the breakdown.'
            : 'Only explicitly tagged savings transactions. Toggle to see your full net surplus.'
          } />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {showNet ? 'Net savings' : 'Logged only'}
          </span>
          <button
            role="switch"
            aria-checked={showNet}
            onClick={() => setShowNet(v => !v)}
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full focus:outline-none transition-all duration-300"
            style={{
              backgroundColor: trackColor,
              boxShadow: `0 0 10px ${glowColor}`,
            }}
          >
            <span
              className="relative inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-300"
              style={{ transform: showNet ? 'translateX(18px)' : 'translateX(3px)' }}
            />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={SAVINGS_COLOR} stopOpacity={0.18} />
                <stop offset="100%" stopColor={SAVINGS_COLOR} stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={NET_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={NET_COLOR} stopOpacity={0.10} />
              </linearGradient>
            </defs>
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
            <Tooltip content={<CustomTooltip showNet={showNet} />} cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke="rgba(148,163,184,0.25)" strokeWidth={1} />

            {/* One Area rendered at a time — key change forces remount and replays animation on toggle */}
            {showNet ? (
              <Area
                key="net"
                type="monotone"
                dataKey="netSavings"
                stroke={NET_COLOR}
                strokeWidth={2}
                fill="url(#netGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: NET_COLOR }}
                connectNulls={false}
              />
            ) : (
              <Area
                key="savings"
                type="monotone"
                dataKey="cumulative"
                stroke={SAVINGS_COLOR}
                strokeWidth={2}
                fill="url(#savingsGrad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: SAVINGS_COLOR }}
                connectNulls={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-5 text-xs text-gray-500 dark:text-gray-400">
        {showNet ? (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded-full shrink-0" style={{ backgroundColor: NET_COLOR }} />
            Cumulative net savings (incl. logged)
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-[2px] rounded-full shrink-0" style={{ backgroundColor: SAVINGS_COLOR }} />
            Logged savings
          </div>
        )}
      </div>
    </div>
  )
}
