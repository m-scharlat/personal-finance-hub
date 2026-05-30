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
import BudgetGuidanceBar from '../components/dashboard/BudgetGuidanceBar'
import type { CategorySpend } from '../components/dashboard/BudgetGuidanceBar'
import type { Transaction, MonthlyTrendPoint } from '../types'

const now          = new Date()
const currentYear  = now.getFullYear()
const currentMonth = now.getMonth() + 1

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type ChartView = 'calendar' | 'trend'

// 12-color categorical series — rotates through design-system palette tokens.
// Colors must be stable per category; assigned before sort so index is insertion-order.
// Ordered to keep perceptually similar hues apart — warm/cool alternating.
const CATEGORICAL_SERIES = [
  'terra',   // warm orange
  'violet',  // cool purple
  'forest',  // cool green
  'red',     // warm red
  'blue',    // cool blue
  'amber',   // warm yellow-orange
  'plum',    // cool deep purple
  'sage',    // cool muted green
  'rose',    // warm pink
  'teal',    // cool blue-green
  'mustard', // warm yellow
  'slate',   // cool blue-gray
] as const

function categoryColor(index: number): string {
  return `var(--${CATEGORICAL_SERIES[index % CATEGORICAL_SERIES.length]})`
}

function MetricSkeleton() {
  return (
    <div className="rounded-[18px] border border-border bg-surface px-5 py-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-surface-alt" />
      <div className="mt-2 h-7 w-28 rounded bg-surface-alt" />
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
      setCompLoading(true)
      setError(null)
      const [{ data, error: err }, { data: compData }] = await Promise.all([
        supabase.from('transactions').select('*').eq('year', selectedYear),
        supabase.from('transactions').select('*').eq('year', selectedYear - 1),
      ])
      if (!cancelled) {
        if (err) setError(err.message)
        else setTransactions(data ?? [])
        setCompTransactions(compData ?? [])
        setLoading(false)
        setCompLoading(false)
      }
    }
    load()
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

  // ── Budget guidance (month view only) ────────────────────────────────────

  const budgetGuidanceData = useMemo<CategorySpend[]>(() => {
    if (!selectedMonth) return []

    // 3 trailing months, handling year boundary
    const trailingMonths: { year: number; month: number }[] = []
    let ty = selectedYear, tm = selectedMonth
    for (let i = 0; i < 3; i++) {
      tm -= 1
      if (tm === 0) { tm = 12; ty -= 1 }
      trailingMonths.push({ year: ty, month: tm })
    }

    // Current month totals by category
    const currentTotals: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === 'expense' && t.month === selectedMonth) {
        currentTotals[t.category] = (currentTotals[t.category] ?? 0) + t.amount
      }
    }

    // Trailing totals — draws from both years' data
    const allTx = [...transactions, ...compTransactions]
    const trailingByCategory: Record<string, number[]> = {}
    for (const { year, month } of trailingMonths) {
      const monthTotals: Record<string, number> = {}
      for (const t of allTx) {
        if (t.type === 'expense' && t.year === year && t.month === month) {
          monthTotals[t.category] = (monthTotals[t.category] ?? 0) + t.amount
        }
      }
      for (const [cat, amt] of Object.entries(monthTotals)) {
        if (!trailingByCategory[cat]) trailingByCategory[cat] = []
        trailingByCategory[cat].push(amt)
      }
    }

    const colorMap = Object.fromEntries(categoryAverages.map(c => [c.category, c.color]))

    return Object.entries(currentTotals)
      .map(([category, currentMonth], i) => {
        const sums = trailingByCategory[category] ?? []
        const trailing3mo = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : 0
        return {
          category,
          color: colorMap[category] ?? categoryColor(i),
          currentMonth,
          trailing3mo,
        }
      })
      .sort((a, b) => b.currentMonth - a.currentMonth)
  }, [transactions, compTransactions, selectedMonth, selectedYear, categoryAverages])

  // ── Render ────────────────────────────────────────────────────────────────

  const netFlowValue = `${metrics.netFlow >= 0 ? '+' : '−'}${formatCurrency(Math.abs(metrics.netFlow))}`

  const CHART_VIEWS: { value: ChartView; label: string }[] = [
    { value: 'trend',    label: 'Trends View'   },
    { value: 'calendar', label: 'Calendar View' },
  ]

  return (
    <div className="px-9 py-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-muted">Your financial overview at a glance.</p>
        </div>
        <YearMonthSelector
          year={selectedYear}
          month={selectedMonth}
          onYearChange={handleYearChange}
          onMonthChange={setSelectedMonth}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-border bg-red-soft px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {/* Metrics row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-[14px]">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
        ) : (
          <>
            <MetricCard
              label="Income"
              value={formatCurrency(metrics.income)}
              color="forest"
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
              color={metrics.netFlow >= 0 ? 'forest' : 'red'}
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
              color="terra"
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
            <h2 className="text-[18px] font-semibold text-ink tracking-[-0.015em]">
              {chartView === 'trend' ? 'Trends' : 'Calendar'}
            </h2>
            <span className="text-[13px] text-ink-faint">{selectedYear}</span>
          </div>

          {/* View toggle — segmented control */}
          <div className="inline-flex items-center rounded-[10px] border border-border bg-surface-alt p-[3px] gap-1">
            {CHART_VIEWS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setChartView(value)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors ${
                  chartView === value
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar View */}
        {chartView === 'calendar' && (
          <div className="rounded-[18px] border border-border bg-surface shadow-card p-5">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border bg-surface-alt p-3.5 animate-pulse">
                    <div className="h-2.5 w-12 rounded bg-border mb-3" />
                    <div className="space-y-2">
                      <div className="h-2 w-full rounded bg-border" />
                      <div className="h-2 w-full rounded bg-border" />
                      <div className="h-2 w-full rounded bg-border" />
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[14px]">
            <div className="lg:col-span-2 flex flex-col gap-[14px] min-h-[380px]">
              {/* Income vs Expenses */}
              <div className="flex-1 rounded-[18px] border border-border bg-surface shadow-card px-5 py-[18px] flex flex-col min-h-0">
                <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-3 shrink-0">
                  Income vs Expenses
                </p>
                {loading ? (
                  <div className="flex-1 rounded-lg bg-surface-alt animate-pulse" />
                ) : (
                  <div className="flex-1 min-h-0">
                    <IncomeExpensesChart data={yearData} />
                  </div>
                )}
              </div>
              {/* Cumulative Savings */}
              <div className="flex-1 rounded-[18px] border border-border bg-surface shadow-card px-5 py-[18px] flex flex-col min-h-0">
                {loading ? (
                  <div className="flex-1 rounded-lg bg-surface-alt animate-pulse" />
                ) : (
                  <div className="flex-1 min-h-0">
                    <CumulativeSavingsChart data={yearData} />
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-[14px]">
              {/* Category Breakdown */}
              <div className="flex-1 rounded-[18px] border border-border bg-surface shadow-card px-5 py-[18px]">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 w-28 rounded bg-surface-alt mb-4" />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <div className="h-3 w-32 rounded bg-surface-alt" />
                        <div className="h-1 rounded-full bg-surface-alt" />
                      </div>
                    ))}
                  </div>
                ) : selectedMonth ? (
                  <BudgetGuidanceBar
                    data={budgetGuidanceData}
                    monthLabel={MONTH_SHORT[selectedMonth - 1]}
                  />
                ) : (
                  <CategoryBreakdown data={categoryAverages} limit={5} />
                )}
              </div>
              {/* Recurring vs One-off */}
              <div className="flex-1 rounded-[18px] border border-border bg-surface shadow-card px-5 py-[18px]">
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3 w-28 rounded bg-surface-alt mb-4" />
                    <div className="h-3 rounded-full bg-surface-alt" />
                    <div className="h-4 w-full rounded bg-surface-alt mt-4" />
                    <div className="h-4 w-full rounded bg-surface-alt" />
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
