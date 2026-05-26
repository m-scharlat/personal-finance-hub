import { useState } from 'react'
import {
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency, niceYAxis, formatYTick } from '../../lib/format'
import InfoTooltip from '../InfoTooltip'
import type { MonthlyTrendPoint } from '../../types'

const SAVINGS_COLOR = 'var(--terra)'
const NET_COLOR     = 'var(--teal)'
const AXIS_COLOR    = 'var(--ink-faint)'
const GRID_COLOR    = 'var(--border)'

// Hardcoded rgba for box-shadow glow (CSS vars can't be used in box-shadow rgba())
const SAVINGS_GLOW  = 'rgba(198,123,70,0.38)'
const NET_GLOW      = 'rgba(13,148,136,0.38)'

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

  const point      = payload[0].payload
  const savings    = point.cumulative
  const netSavings = point.netSavings

  if (showNet) {
    if (netSavings == null) return null
    const unlogged = savings != null && netSavings > savings ? netSavings - savings : null
    const hasBreakdown = savings != null || unlogged != null
    return (
      <div className="rounded-[10px] border border-border bg-surface shadow-card px-3 py-2.5 text-xs">
        <p className="font-medium text-ink-muted mb-2">{label}</p>
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: NET_COLOR }} />
            <span className="text-ink-muted">Net savings</span>
          </div>
          <span className="font-semibold num" style={{ color: NET_COLOR }}>{formatCurrency(netSavings)}</span>
        </div>
        {hasBreakdown && (
          <div className="mt-1.5 ml-1.5 pl-2.5 border-l-2 border-border space-y-1">
            {savings != null && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SAVINGS_COLOR }} />
                  <span className="text-ink-muted">Logged</span>
                </div>
                <span className="font-semibold num" style={{ color: SAVINGS_COLOR }}>{formatCurrency(savings)}</span>
              </div>
            )}
            {unlogged != null && (
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-border-strong" />
                  <span className="text-ink-faint">Unlogged</span>
                </div>
                <span className="num text-ink-faint">{formatCurrency(unlogged)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (savings == null) return null
  return (
    <div className="rounded-[10px] border border-border bg-surface shadow-card px-3 py-2.5 text-xs">
      <p className="font-medium text-ink-muted mb-2">{label}</p>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: SAVINGS_COLOR }} />
          <span className="text-ink-muted">Logged savings</span>
        </div>
        <span className="font-semibold num" style={{ color: SAVINGS_COLOR }}>{formatCurrency(savings)}</span>
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

  const yMax = Math.max(...chartData.map(d => (showNet ? d.netSavings : d.cumulative) ?? 0), 1)
  const { ticks: yTicks, domain: yDomain } = niceYAxis(yMax)

  const glowColor  = showNet ? NET_GLOW : SAVINGS_GLOW
  const trackColor = showNet ? NET_COLOR : SAVINGS_COLOR

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">
            {showNet ? 'Cumulative Net Savings' : 'Cumulative Savings'}
          </p>
          <InfoTooltip text={showNet
            ? 'Net savings = income minus expenses. Logged savings are a named portion of that total — hover to see the breakdown.'
            : 'Only explicitly tagged savings transactions. Toggle to see your full net surplus.'
          } />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint">
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
            <Tooltip content={<CustomTooltip showNet={showNet} />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
            <ReferenceLine y={0} stroke="var(--border-strong)" strokeWidth={1} />

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
      <div className="mt-2 flex items-center gap-5 text-xs text-ink-muted">
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
