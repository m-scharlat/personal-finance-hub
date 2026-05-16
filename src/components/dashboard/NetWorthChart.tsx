import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/format'
import type { NetWorthAccount, NetWorthSnapshot } from '../../types'

type Horizon = 'history' | '1y' | '5y' | '10y'

interface ChartPoint {
  date: string
  netWorth: number | null
  projected: number | null
  growthComponent: number | null   // projected points only: portion from account growth rates
  savingsComponent: number | null  // projected points only: portion from accumulated surplus
  isEstimated: boolean
  isProjection: boolean
}

const HORIZON_STEPS: Record<Exclude<Horizon, 'history'>, { totalMonths: number; stepMonths: number }> = {
  '1y':  { totalMonths: 12,  stepMonths: 1 },
  '5y':  { totalMonths: 60,  stepMonths: 3 },
  '10y': { totalMonths: 120, stepMonths: 6 },
}

// Target x-axis label count per horizon — sampled from actual data points so labels always land
const HORIZON_TICKS: Record<Horizon, number> = {
  'history': 5,
  '1y':      7,
  '5y':      7,
  '10y':     7,
}

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildChartData(
  accounts: NetWorthAccount[],
  snapshots: NetWorthSnapshot[],
  monthlyNetSavings: number,
  horizon: Horizon,
): ChartPoint[] {
  if (!accounts.length || !snapshots.length) return []

  const snapsByAccount = new Map<string, NetWorthSnapshot[]>()
  for (const a of accounts) snapsByAccount.set(a.id, [])
  for (const s of snapshots) snapsByAccount.get(s.account_id)?.push(s)

  const allDates = [...new Set(snapshots.map(s => s.snapshot_date))].sort()

  const points: ChartPoint[] = allDates.map(date => {
    let total = 0
    for (const account of accounts) {
      const snap = [...(snapsByAccount.get(account.id) ?? [])].reverse().find(s => s.snapshot_date <= date)
      if (snap) total += account.type === 'debt' ? -snap.balance : snap.balance
    }
    return { date, netWorth: total, projected: null, growthComponent: null, savingsComponent: null, isEstimated: false, isProjection: false }
  })

  // Compute today's anchor once — same value on both the history endpoint and the
  // projection start, making a visual seam structurally impossible.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tStr = todayDateStr()

  let anchorTotal = 0
  let hasEstimate = false
  const anchorBalances = new Map<string, { balance: number; account: NetWorthAccount }>()

  for (const account of accounts) {
    const acctSnaps = snapsByAccount.get(account.id) ?? []
    const lastSnap = acctSnaps[acctSnaps.length - 1]
    if (!lastSnap) continue
    let balance = lastSnap.balance
    if (account.growth_rate && account.growth_rate > 0) {
      const days = Math.floor(
        (today.getTime() - new Date(lastSnap.snapshot_date + 'T00:00:00').getTime()) / 86_400_000
      )
      if (days > 0) { balance = balance * Math.pow(1 + account.growth_rate, days / 365); hasEstimate = true }
    }
    anchorBalances.set(account.id, { balance, account })
    anchorTotal += account.type === 'debt' ? -balance : balance
  }

  if (allDates[allDates.length - 1] < tStr) {
    points.push({
      date: tStr, netWorth: anchorTotal, projected: anchorTotal,
      growthComponent: null, savingsComponent: null,
      isEstimated: hasEstimate, isProjection: false,
    })
  } else {
    const last = points[points.length - 1]
    last.projected = last.netWorth
  }

  if (horizon === 'history') return points

  // Projection: compound growth on existing balances + linear accumulation of avg monthly surplus
  const { totalMonths, stepMonths } = HORIZON_STEPS[horizon]
  for (let i = 1; i <= totalMonths / stepMonths; i++) {
    const projDate = new Date(today)
    projDate.setMonth(projDate.getMonth() + i * stepMonths)
    const daysAhead = (projDate.getTime() - today.getTime()) / 86_400_000
    const monthsAhead = i * stepMonths

    let growthTotal = 0
    for (const [, { balance, account }] of anchorBalances) {
      let b = balance
      if (account.growth_rate && account.growth_rate > 0 && account.type !== 'debt') {
        b = balance * Math.pow(1 + account.growth_rate, daysAhead / 365)
      }
      growthTotal += account.type === 'debt' ? -b : b
    }

    const savingsAccum = monthsAhead * monthlyNetSavings

    points.push({
      date: projDate.toISOString().split('T')[0],
      netWorth: null,
      projected: growthTotal + savingsAccum,
      growthComponent: growthTotal,
      savingsComponent: savingsAccum,
      isEstimated: true,
      isProjection: true,
    })
  }

  return points
}

// Round-number Y-axis targeting ~5 ticks
function computeNiceAxis(values: number[]): { domain: [number, number]; ticks: number[] } {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1000
    return { domain: [min - pad, max + pad], ticks: [min - pad, min, max + pad] }
  }
  const range = max - min
  const roughInterval = (range * 1.16) / 5
  const mag = Math.pow(10, Math.floor(Math.log10(roughInterval)))
  const norm = roughInterval / mag
  const niceInterval = norm <= 1 ? mag : norm <= 2 ? 2 * mag : norm <= 5 ? 5 * mag : 10 * mag
  const niceMin = Math.floor((min - range * 0.08) / niceInterval) * niceInterval
  const niceMax = Math.ceil((max  + range * 0.08) / niceInterval) * niceInterval
  const ticks: number[] = []
  for (let t = niceMin; t <= niceMax + niceInterval * 0.001; t += niceInterval) ticks.push(Math.round(t))
  return { domain: [niceMin, niceMax], ticks }
}

// Sample evenly-spaced ticks from actual data point dates so they always render on the
// category axis (string key matching — generated "first-of-month" dates would silently miss).
function generateTicks(points: ChartPoint[], targetCount: number): string[] {
  if (points.length === 0) return []
  if (points.length <= targetCount) return points.map(p => p.date)
  const ticks: string[] = []
  for (let i = 0; i < targetCount; i++) {
    const idx = Math.round(i * (points.length - 1) / (targetCount - 1))
    ticks.push(points[idx].date)
  }
  return [...new Set(ticks)]
}

function formatYAxis(value: number): string {
  const abs  = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000)     return `${sign}$${Math.round(abs / 1_000)}k`
  return `${sign}$${abs}`
}

interface TooltipProps { active?: boolean; payload?: Array<{ payload: ChartPoint }> }

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const pt = payload[0].payload
  const value = pt.netWorth ?? pt.projected
  if (value === null) return null
  const label = new Date(pt.date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  const suffix = pt.isProjection ? ' · projected' : pt.isEstimated ? ' · estimated' : ''
  const showBreakdown = pt.isProjection && pt.growthComponent !== null && pt.savingsComponent !== null

  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-[170px]">
      <p className="text-gray-500 dark:text-gray-400 mb-0.5">{label}{suffix}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(value)}</p>
      {showBreakdown && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700 space-y-0.5 text-gray-400 dark:text-gray-500">
          <div className="flex justify-between gap-5">
            <span>Account growth</span>
            <span>{formatCurrency(pt.growthComponent!)}</span>
          </div>
          <div className="flex justify-between gap-5">
            <span>Saved surplus</span>
            <span>{formatCurrency(pt.savingsComponent!)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function NetWorthChart() {
  const [accounts,          setAccounts]          = useState<NetWorthAccount[]>([])
  const [snapshots,         setSnapshots]         = useState<NetWorthSnapshot[]>([])
  const [monthlyNetSavings, setMonthlyNetSavings] = useState(0)
  const [horizon,           setHorizon]           = useState<Horizon>('1y')
  const [loading,           setLoading]           = useState(true)

  const points = useMemo(
    () => buildChartData(accounts, snapshots, monthlyNetSavings, horizon),
    [accounts, snapshots, monthlyNetSavings, horizon],
  )

  useEffect(() => { load() }, [])

  async function load() {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 6)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const [acctRes, snapRes, txRes] = await Promise.all([
      supabase.from('net_worth_accounts').select('*').eq('active', true),
      supabase.from('net_worth_snapshots').select('*').order('snapshot_date'),
      supabase.from('transactions').select('type, amount').gte('date', cutoffStr),
    ])

    let income = 0, expenses = 0
    for (const tx of (txRes.data ?? []) as { type: string; amount: number }[]) {
      if (tx.type === 'income')  income   += tx.amount
      if (tx.type === 'expense') expenses += tx.amount
    }

    setAccounts((acctRes.data ?? []) as NetWorthAccount[])
    setSnapshots((snapRes.data ?? []) as NetWorthSnapshot[])
    setMonthlyNetSavings((income - expenses) / 6)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 animate-pulse">
        <div className="h-3 w-36 rounded bg-gray-100 dark:bg-gray-800 mb-5" />
        <div className="h-[200px] rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    )
  }

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Log balances on at least two dates to see your wealth curve.
        </p>
      </div>
    )
  }

  const tStr = todayDateStr()
  const isProjecting = horizon !== 'history'
  const xTicks = generateTicks(points, HORIZON_TICKS[horizon])
  const spanDays = points.length >= 2
    ? (new Date(points[points.length - 1].date + 'T00:00:00').getTime() - new Date(points[0].date + 'T00:00:00').getTime()) / 86_400_000
    : 0
  const formatXTick = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return (horizon === 'history' && spanDays <= 730) || horizon === '1y'
      ? d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : d.toLocaleDateString('en-US', { year: 'numeric' })
  }

  const allValues = points.flatMap(p => [p.netWorth, p.projected]).filter((v): v is number => v !== null)
  const { domain: yDomain, ticks: yTicks } = computeNiceAxis(allValues)

  const accountsWithGrowth = accounts.filter(a => a.growth_rate && a.growth_rate > 0 && a.type !== 'debt').length
  const hasSavings = Math.abs(monthlyNetSavings) >= 1

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Net Worth Over Time
        </p>
        <div className="inline-flex items-center gap-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['history', '1y', '5y', '10y'] as Horizon[]).map(h => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className={`relative px-2.5 py-0.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                horizon === h
                  ? 'text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {horizon === h && (
                <motion.div
                  layoutId="horizon-active"
                  className="absolute inset-0 bg-[#d4a843] rounded-md shadow-sm"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">
                {h === 'history' ? 'History' : h.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#d4a843" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#d4a843" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tickFormatter={formatXTick}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={yDomain}
            ticks={yTicks}
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#d4a843', strokeWidth: 1, strokeDasharray: '4 2' }}
          />
          {/* "Now" marker — only meaningful when projection is visible */}
          {isProjecting && (
            <ReferenceLine
              x={tStr}
              stroke="#d1d5db"
              strokeWidth={1}
              label={{ value: 'Now', position: 'insideTopRight', fontSize: 9, fill: '#9ca3af', dy: 2 }}
            />
          )}
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#d4a843"
            strokeWidth={2}
            fill="url(#nwGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#d4a843', strokeWidth: 0 }}
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="projected"
            stroke="#d4a843"
            strokeWidth={2}
            strokeDasharray="5 3"
            strokeOpacity={0.55}
            fill="none"
            dot={false}
            activeDot={{ r: 4, fill: '#d4a843', strokeWidth: 0 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Projection assumptions — only shown when a projection horizon is active */}
      {isProjecting && (hasSavings || accountsWithGrowth > 0) && (
        <p className="mt-3 text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed">
          Projection assumes
          {hasSavings && (
            <> avg. <span className="font-medium text-gray-500 dark:text-gray-400">
              {monthlyNetSavings >= 0 ? '+' : ''}{formatCurrency(Math.round(monthlyNetSavings))}/mo
            </span> surplus (6-month avg.)</>
          )}
          {hasSavings && accountsWithGrowth > 0 && ' and'}
          {accountsWithGrowth > 0 && (
            <> compound growth on <span className="font-medium text-gray-500 dark:text-gray-400">
              {accountsWithGrowth} account{accountsWithGrowth !== 1 ? 's' : ''}
            </span></>
          )}.
          {' '}Hover projected points to see the breakdown.
        </p>
      )}
    </div>
  )
}
