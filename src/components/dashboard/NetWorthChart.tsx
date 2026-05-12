import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../../lib/supabase'
import { formatCurrency } from '../../lib/format'
import type { NetWorthAccount, NetWorthSnapshot } from '../../types'

interface ChartPoint {
  date: string
  netWorth: number
  isEstimated: boolean
}

function buildChartData(accounts: NetWorthAccount[], snapshots: NetWorthSnapshot[]): ChartPoint[] {
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
    return { date, netWorth: total, isEstimated: false }
  })

  // Append a growth-estimated "today" point if the last snapshot isn't today
  const d = new Date()
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  if (allDates[allDates.length - 1] < todayStr) {
    let todayTotal = 0
    let hasEstimate = false
    for (const account of accounts) {
      const acctSnaps = snapsByAccount.get(account.id) ?? []
      const lastSnap  = acctSnaps[acctSnaps.length - 1]
      if (!lastSnap) continue
      let balance = lastSnap.balance
      if (account.growth_rate && account.growth_rate > 0) {
        const days = Math.floor(
          (new Date().setHours(0, 0, 0, 0) - new Date(lastSnap.snapshot_date + 'T00:00:00').getTime()) / 86_400_000
        )
        if (days > 0) { balance = balance * Math.pow(1 + account.growth_rate, days / 365); hasEstimate = true }
      }
      todayTotal += account.type === 'debt' ? -balance : balance
    }
    points.push({ date: todayStr, netWorth: todayTotal, isEstimated: hasEstimate })
  }

  return points
}

// Generate sparse tick positions so x-axis labels don't pile up
function generateTicks(points: ChartPoint[]): string[] {
  if (points.length < 2) return []

  const first    = new Date(points[0].date + 'T00:00:00')
  const last     = new Date(points[points.length - 1].date + 'T00:00:00')
  const spanDays = (last.getTime() - first.getTime()) / 86_400_000

  const intervalMonths = spanDays <= 90  ? 1
    : spanDays <= 365  ? 2
    : spanDays <= 730  ? 3
    : spanDays <= 1460 ? 6
    : 12

  const ticks: string[] = []
  const d = new Date(first)
  d.setDate(1)
  d.setMonth(d.getMonth() + intervalMonths)

  while (d <= last) {
    ticks.push(d.toISOString().split('T')[0])
    d.setMonth(d.getMonth() + intervalMonths)
  }

  if (!ticks.length || ticks[0] > points[0].date) ticks.unshift(points[0].date)
  if (ticks[ticks.length - 1] < points[points.length - 1].date) ticks.push(points[points.length - 1].date)

  return ticks
}

function formatYAxis(value: number): string {
  const abs  = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}m`
  if (abs >= 1_000)     return `${sign}$${Math.round(abs / 1_000)}k`
  return `${sign}$${abs}`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const { date, netWorth, isEstimated } = payload[0].payload
  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <p className="text-gray-500 dark:text-gray-400 mb-0.5">
        {label}{isEstimated ? ' · estimated' : ''}
      </p>
      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(netWorth)}</p>
    </div>
  )
}

export default function NetWorthChart() {
  const [points, setPoints] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [acctRes, snapRes] = await Promise.all([
      supabase.from('net_worth_accounts').select('*').eq('active', true),
      supabase.from('net_worth_snapshots').select('*').order('snapshot_date'),
    ])
    setPoints(buildChartData(
      (acctRes.data ?? []) as NetWorthAccount[],
      (snapRes.data ?? []) as NetWorthSnapshot[],
    ))
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

  const ticks = generateTicks(points)
  const formatXTick = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

  const values  = points.map(p => p.netWorth)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const pad     = (dataMax - dataMin) * 0.15 || Math.abs(dataMin) * 0.1 || 1000
  const yDomain: [number, number] = [dataMin - pad, dataMax + pad]

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-5">
        Net Worth Over Time
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#d4a843" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#d4a843" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatXTick}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={yDomain}
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
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#d4a843"
            strokeWidth={2}
            fill="url(#nwGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#d4a843', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
