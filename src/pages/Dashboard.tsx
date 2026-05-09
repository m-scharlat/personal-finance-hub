import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'
import MetricCard from '../components/dashboard/MetricCard'
import YearMonthSelector from '../components/dashboard/YearMonthSelector'
import IncomeExpensesChart from '../components/dashboard/IncomeExpensesChart'
import CumulativeSavingsChart from '../components/dashboard/CumulativeSavingsChart'
import CalendarView from '../components/dashboard/CalendarView'
import RecurringVsOneOffBar from '../components/dashboard/RecurringVsOneOffBar'
import CategoryBreakdown from '../components/dashboard/CategoryBreakdown'
import type { CategoryAvg } from '../components/dashboard/CategoryBreakdown'
import type { Transaction, MonthlyTrendPoint } from '../types'

const now          = new Date()
const currentYear  = now.getFullYear()
const currentMonth = now.getMonth() + 1

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type ChartView = 'calendar' | 'trend'

// 20 hand-picked, visually distinct colors. For > 20 categories, HSL fills the gap.
const CATEGORY_PALETTE = [
  '#6366f1','#ec4899','#f97316','#10b981','#06b6d4',
  '#f43f5e','#8b5cf6','#eab308','#3b82f6','#84cc16',
  '#14b8a6','#f59e0b','#ef4444','#a855f7','#22c55e',
  '#0ea5e9','#d946ef','#64748b','#e879f9','#fb923c',
]
function categoryColor(index: number): string {
  if (index < CATEGORY_PALETTE.length) return CATEGORY_PALETTE[index]
  // Evenly distribute hues for any overflow categories
  const hue = Math.round((index * 137.508) % 360) // golden-angle spacing
  return `hsl(${hue}, 60%, 55%)`
}

function MetricSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
      <div className="mt-2 h-7 w-28 rounded bg-gray-100 dark:bg-gray-800" />
    </div>
  )
}

export default function Dashboard() {
  const [selectedYear, setSelectedYear]   = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [transactions, setTransactions]   = useState<Transaction[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [chartView, setChartView]           = useState<ChartView>('trend')
  const [compTransactions, setCompTransactions] = useState<Transaction[]>([])
  const [compLoading, setCompLoading]       = useState(true)

  function handleYearChange(year: number) {
    setSelectedYear(year)
    setSelectedMonth(null)
  }

  // Single fetch for the selected year — serves all dashboard sections
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: err } = await supabase
        .from('transactions')
        .select('*')
        .eq('year', selectedYear)
      if (!cancelled) {
        if (err) setError(err.message)
        else setTransactions(data ?? [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedYear])

  // Fetch previous year for YoY comparison
  useEffect(() => {
    let cancelled = false
    setCompLoading(true)
    supabase
      .from('transactions')
      .select('*')
      .eq('year', selectedYear - 1)
      .then(({ data }) => {
        if (!cancelled) {
          setCompTransactions(data ?? [])
          setCompLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [selectedYear])

  // ── Metrics (Phase 1) ─────────────────────────────────────────────────────

  const metrics = useMemo(() => {
    const isCurrentYear = selectedYear === currentYear
    const filtered = selectedMonth
      ? transactions.filter(t => t.month === selectedMonth)
      : isCurrentYear
        ? transactions.filter(t => t.month <= currentMonth)
        : transactions

    const income   = filtered.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const savings  = filtered.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
    const netFlow  = income - expenses
    const savingsRate = income > 0 ? (savings / income) * 100 : null

    // committed/mo — always full-year, deduped, normalized to monthly rate
    const seen = new Set<string>()
    let committed = 0
    const byCat: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type !== 'expense' || !t.recurrence) continue
      const key = t.recurrence_group_id ?? t.id
      if (seen.has(key)) continue
      seen.add(key)
      let rate = 0
      if (t.recurrence === 'weekly')  rate = t.amount * 52 / 12
      if (t.recurrence === 'monthly') rate = t.amount
      if (t.recurrence === 'annual')  rate = t.amount / 12
      committed += rate
      byCat[t.category] = (byCat[t.category] ?? 0) + rate
    }
    const committedByCategory = Object.entries(byCat)
      .map(([category, monthlyRate]) => ({ category, monthlyRate }))
      .sort((a, b) => b.monthlyRate - a.monthlyRate)

    const incomeTx = isCurrentYear
      ? transactions.filter(t => t.type === 'income' && t.month <= currentMonth)
      : transactions.filter(t => t.type === 'income')
    const avgMonthlyIncome = incomeTx.reduce((s, t) => s + t.amount, 0) / (isCurrentYear ? currentMonth : 12)

    return { income, expenses, savings, netFlow, savingsRate, committed, committedByCategory, avgMonthlyIncome }
  }, [transactions, selectedMonth, selectedYear])

  // ── Comparison metrics (previous year, same period) ──────────────────────

  const compMetrics = useMemo(() => {
    const filtered = selectedMonth
      ? compTransactions.filter(t => t.month === selectedMonth)
      : selectedYear === currentYear
        ? compTransactions.filter(t => t.month <= currentMonth)
        : compTransactions
    const income   = filtered.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
    const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const savings  = filtered.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0)
    const savingsRate = income > 0 ? (savings / income) * 100 : null
    const netFlow  = income - expenses
    return { income, expenses, savings, savingsRate, netFlow }
  }, [compTransactions, selectedMonth, selectedYear])

  const deltas = useMemo(() => {
    if (compLoading) return null
    if (compTransactions.length === 0) return null
    const prevYear  = selectedYear - 1
    const label = selectedMonth
      ? `vs ${MONTH_SHORT[selectedMonth - 1]} '${String(prevYear).slice(2)}`
      : selectedYear === currentYear
        ? `vs Jan–${MONTH_SHORT[currentMonth - 1]} '${String(prevYear).slice(2)}`
        : `vs ${prevYear}`

    function pct(curr: number, prev: number) {
      if (prev === 0) return null
      return ((curr - prev) / prev) * 100
    }
    function fmtPct(val: number | null) {
      if (val === null) return null
      return `${val >= 0 ? '↑' : '↓'} ${Math.abs(val).toFixed(1)}%`
    }

    const incomePct   = pct(metrics.income,   compMetrics.income)
    const expensesPct = pct(metrics.expenses, compMetrics.expenses)
    const hasCompData = compMetrics.income > 0 || compMetrics.expenses > 0 || compMetrics.savings > 0
    const netDiff     = hasCompData ? metrics.netFlow - compMetrics.netFlow : null
    const rateDiff    = metrics.savingsRate !== null && compMetrics.savingsRate !== null
      ? metrics.savingsRate - compMetrics.savingsRate
      : null

    return {
      label,
      income:      { delta: fmtPct(incomePct),   good: incomePct   === null ? undefined : incomePct   >= 0 },
      expenses:    { delta: fmtPct(expensesPct),  good: expensesPct === null ? undefined : expensesPct <= 0 },
      netFlow:     { delta: netDiff !== null && netDiff !== 0 ? `${netDiff >= 0 ? '↑' : '↓'} ${formatCurrency(Math.abs(netDiff))}` : null,
                     good: netDiff !== null ? netDiff >= 0 : undefined },
      savingsRate: { delta: rateDiff !== null ? `${rateDiff >= 0 ? '↑' : '↓'} ${Math.abs(rateDiff).toFixed(1)}pp` : null,
                     good: rateDiff !== null ? rateDiff >= 0 : undefined },
    }
  }, [metrics, compMetrics, compLoading, selectedYear, selectedMonth])

  // ── Year data (Jan–Dec of selected year) — shared by both chart views ─────

  const yearData = useMemo<MonthlyTrendPoint[]>(() => {
    const slots: MonthlyTrendPoint[] = Array.from({ length: 12 }, (_, i) => ({
      label:  MONTH_SHORT[i],
      year:   selectedYear,
      month:  i + 1,
      income: 0, expenses: 0, savings: 0, savingsRate: 0,
    }))
    for (const t of transactions) {
      const slot = slots[t.month - 1]
      if (!slot) continue
      if (t.type === 'income')  slot.income   += t.amount
      if (t.type === 'expense') slot.expenses += t.amount
      if (t.type === 'savings') slot.savings  += t.amount
    }
    for (const slot of slots) {
      slot.savingsRate = slot.income > 0 ? Math.round((slot.savings / slot.income) * 100) : 0
    }
    return slots
  }, [transactions, selectedYear])

  // ── Trend sidebar data ────────────────────────────────────────────────────

  const categoryAverages = useMemo<CategoryAvg[]>(() => {
    const expenseTx = transactions.filter(t =>
      t.type === 'expense' && (selectedYear !== currentYear || t.month <= currentMonth)
    )
    const monthsWithData = new Set(expenseTx.map(t => `${t.year}-${t.month}`)).size || 1
    const totals: Record<string, number> = {}
    for (const t of expenseTx) totals[t.category] = (totals[t.category] ?? 0) + t.amount
    return Object.entries(totals)
      .map(([category, total], i) => ({
        category,
        avgPerMonth: total / monthsWithData,
        color: categoryColor(i),
      }))
      .sort((a, b) => b.avgPerMonth - a.avgPerMonth)
  }, [transactions, selectedYear])

  // ── Render ────────────────────────────────────────────────────────────────

  const netFlowValue = `${metrics.netFlow >= 0 ? '+' : '−'}${formatCurrency(Math.abs(metrics.netFlow))}`

  const CHART_VIEWS: { value: ChartView; label: string }[] = [
    { value: 'trend',    label: 'Trends View'   },
    { value: 'calendar', label: 'Calendar View' },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your financial overview at a glance.</p>
        </div>
        <YearMonthSelector
          year={selectedYear}
          month={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Metrics row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label="Income"
              value={formatCurrency(metrics.income)}
              color="green"
              delta={deltas?.income.delta ?? undefined}
              deltaGood={deltas?.income.good}
              deltaLabel={deltas?.label}
            />
            <MetricCard
              label="Expenses"
              value={formatCurrency(metrics.expenses)}
              color="red"
              delta={deltas?.expenses.delta ?? undefined}
              deltaGood={deltas?.expenses.good}
              deltaLabel={deltas?.label}
            />
            <MetricCard
              label="Net Cash Flow"
              value={netFlowValue}
              color={metrics.netFlow >= 0 ? 'green' : 'red'}
              info={!selectedMonth && selectedYear === currentYear
                ? 'Future-dated transactions are excluded.'
                : undefined}
              delta={deltas?.netFlow.delta ?? undefined}
              deltaGood={deltas?.netFlow.good}
              deltaLabel={deltas?.label}
            />
            <MetricCard
              label="Savings Rate"
              value={metrics.savingsRate !== null ? `${metrics.savingsRate.toFixed(1)}%` : '—'}
              subLabel={metrics.savingsRate === null ? 'No income recorded' : undefined}
              info={`Logged savings ÷ income. Only includes transactions explicitly tagged as savings.${!selectedMonth && selectedYear === currentYear ? '\n\nFuture-dated transactions are excluded.' : ''}`}
              color="indigo"
              delta={deltas?.savingsRate.delta ?? undefined}
              deltaGood={deltas?.savingsRate.good}
              deltaLabel={deltas?.label}
            />
          </>
        )}
      </div>

      {/* Trends section */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{chartView === 'trend' ? 'Trends' : 'Calendar'}</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">{selectedYear}</span>
          </div>

          {/* View toggle */}
          <div className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-0.5 gap-0.5">
            {CHART_VIEWS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setChartView(value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  chartView === value
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {chartView === 'calendar' && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-3.5 animate-pulse">
                    <div className="h-2.5 w-12 rounded bg-gray-100 dark:bg-gray-700 mb-3" />
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded bg-gray-100 dark:bg-gray-700" />
                      <div className="h-2 w-full rounded bg-gray-100 dark:bg-gray-700" />
                      <div className="h-2 w-full rounded bg-gray-100 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CalendarView data={yearData} year={selectedYear} />
            )}
          </div>
        )}

        {/* Trends View */}
        {chartView === 'trend' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-[380px]">
              {/* Income vs Expenses */}
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 flex flex-col min-h-0">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 shrink-0">
                  Income vs Expenses
                </p>
                {loading ? (
                  <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
                ) : (
                  <div className="flex-1 min-h-0">
                    <IncomeExpensesChart data={yearData} />
                  </div>
                )}
              </div>
              {/* Cumulative Savings */}
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 flex flex-col min-h-0">
                {loading ? (
                  <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
                ) : (
                  <div className="flex-1 min-h-0">
                    <CumulativeSavingsChart data={yearData} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {/* Category Breakdown */}
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-5">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800 mb-4" />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-32 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <CategoryBreakdown data={categoryAverages} limit={5} />
                )}
              </div>
              {/* Recurring vs One-off */}
              <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-5">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 w-28 rounded bg-gray-100 dark:bg-gray-800 mb-4" />
                    <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800" />
                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800 mt-4" />
                    <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                ) : (
                  <RecurringVsOneOffBar
                    committed={metrics.committed}
                    avgMonthlyIncome={metrics.avgMonthlyIncome}
                    committedByCategory={metrics.committedByCategory}
                    categoryColorMap={Object.fromEntries(categoryAverages.map(c => [c.category, c.color]))}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
