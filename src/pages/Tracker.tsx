import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/format'
import TransactionModal from '../components/TransactionModal'
import type { Transaction, TransactionType } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const now = new Date()
const currentYear  = now.getFullYear()
const currentMonth = now.getMonth() + 1
const YEARS = Array.from({ length: currentYear - 2025 }, (_, i) => 2026 + i)
const TYPES: TransactionType[] = ['income', 'expense', 'savings']

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode  = 'transactions' | 'summary'
type SortCol   = 'date' | 'type' | 'category' | 'amount'
type SortDir   = 'asc' | 'desc'
interface SortState { col: SortCol; dir: SortDir }
interface AggRow   { category: string; amount: number }
interface AggGroup { type: TransactionType; total: number; rows: AggRow[] }

const TYPE_ORDER: Record<TransactionType, number> = { income: 0, expense: 1, savings: 2 }

// ── Styles ───────────────────────────────────────────────────────────────────

// bg + text Tailwind classes per type — reference §2 TxnTypeColor
const TYPE_BADGE_BG: Record<TransactionType, string> = {
  income:  'bg-forest-soft text-forest',
  expense: 'bg-red-soft    text-red',
  savings: 'bg-terra-soft  text-terra',
}

const TYPE_BADGE_DOT: Record<TransactionType, string> = {
  income:  'bg-forest',
  expense: 'bg-red',
  savings: 'bg-terra',
}

const AMOUNT_COLOR: Record<TransactionType, string> = {
  income:  'text-forest',
  expense: 'text-red',
  savings: 'text-terra',
}

const BAR_COLOR: Record<TransactionType, string> = {
  income:  'bg-forest',
  expense: 'bg-red',
  savings: 'bg-terra',
}

// Active type-filter chip — soft tint per type; "all" uses ink/bg inversion
const TYPE_PILL_ON: Record<string, string> = {
  all:     'bg-ink text-bg',
  expense: 'bg-red-soft    text-red',
  income:  'bg-forest-soft text-forest',
  savings: 'bg-terra-soft  text-terra',
}

const TYPE_PILL_OFF =
  'bg-transparent text-ink-muted border border-border hover:bg-surface-alt'

const QUICK_ON  = 'bg-ink text-bg border border-transparent'
const QUICK_OFF = 'bg-surface text-ink-muted border border-border hover:bg-surface-alt'

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"
      className={active ? 'text-terra' : 'text-ink-faint'}>
      <path d="M5 1L8 4H2L5 1Z" fill="currentColor" fillOpacity={active && dir === 'asc' ? 1 : 0.35} />
      <path d="M5 9L2 6H8L5 9Z" fill="currentColor" fillOpacity={active && dir === 'desc' ? 1 : 0.35} />
    </svg>
  )
}

function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] font-medium capitalize ${TYPE_BADGE_BG[type]}`}>
      <span className={`w-[5px] h-[5px] rounded-full opacity-70 ${TYPE_BADGE_DOT[type]}`} />
      {type}
    </span>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: number | null
  onChange: (v: number | null) => void
  options: { value: number; label: string }[]
  placeholder: string
}) {
  const active = value !== null
  return (
    <div className="relative inline-flex">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className={`appearance-none text-[12.5px] pl-3 pr-7 py-1.5 rounded-[8px] border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-terra ${
          active
            ? 'border-border-strong bg-terra-soft text-terra'
            : 'border-border bg-bg text-ink'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ink-faint"
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  )
}

function SummaryGroup({ group }: { group: AggGroup }) {
  const { type, total, rows } = group
  return (
    <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <TypeBadge type={type} />
        <span className={`text-[18px] font-semibold num ${AMOUNT_COLOR[type]}`}>
          {formatCurrency(total)}
        </span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => {
          const pct = total > 0 ? (row.amount / total) * 100 : 0
          return (
            <div key={row.category} className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13.5px] text-ink">{row.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs num text-ink-faint">{pct.toFixed(1)}%</span>
                  <span className={`text-[13.5px] font-medium num ${AMOUNT_COLOR[type]}`}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full bg-surface-alt rounded-full overflow-hidden">
                <div className={`h-full ${BAR_COLOR[type]} rounded-full`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NetSavingsCard({
  netAmount,
  savingsGroup,
}: {
  netAmount: number
  savingsGroup: AggGroup | null
}) {
  const isDeficit = netAmount < 0
  const totalAllocated = savingsGroup?.total ?? 0
  const barBase = !isDeficit && netAmount > 0 ? netAmount : totalAllocated
  const remaining = !isDeficit && savingsGroup ? netAmount - totalAllocated : null

  return (
    <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[13.5px] font-semibold text-ink">Net Savings</span>
          {isDeficit && savingsGroup && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-border bg-amber-soft text-amber">
              Savings during deficit
            </span>
          )}
        </div>
        <span className={`text-[18px] font-semibold num ${isDeficit ? 'text-red' : 'text-forest'}`}>
          {isDeficit ? '−' : '+'}{formatCurrency(Math.abs(netAmount))}
        </span>
      </div>

      {/* Savings breakdown */}
      {savingsGroup ? (
        <div className="divide-y divide-border">
          {savingsGroup.rows.map((row) => {
            const pct = barBase > 0 ? (row.amount / barBase) * 100 : 0
            return (
              <div key={row.category} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] text-ink">{row.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs num text-ink-faint">{pct.toFixed(1)}%</span>
                    <span className="text-[13.5px] font-medium num text-terra">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full bg-surface-alt rounded-full overflow-hidden">
                  <div className="h-full bg-terra rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            )
          })}

          {remaining !== null && remaining > 0 && (
            <div className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13.5px] text-ink-muted">Remaining</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs num text-ink-faint">
                    {((remaining / netAmount) * 100).toFixed(1)}%
                  </span>
                  <span className="text-[13.5px] font-medium num text-ink">
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full bg-surface-alt rounded-full overflow-hidden">
                <div className="h-full bg-border rounded-full" style={{ width: `${(remaining / netAmount) * 100}%` }} />
              </div>
            </div>
          )}

          {isDeficit && (
            <div className="px-5 py-3 text-xs text-amber bg-amber-soft">
              These savings were drawn from an existing balance during a deficit period.
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 text-sm text-ink-faint">
          {isDeficit
            ? 'Spending exceeded income this period — no savings allocated.'
            : 'No savings allocated this period.'}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Tracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [refresh, setRefresh]           = useState(0)

  const [view, setView]               = useState<ViewMode>('transactions')
  const [searchParams] = useSearchParams()
  const [filterYear, setFilterYear]   = useState<number | null>(() => {
    const y = searchParams.get('year')
    return y ? Number(y) : null
  })
  const [filterMonth, setFilterMonth] = useState<number | null>(() => {
    const m = searchParams.get('month')
    return m ? Number(m) : null
  })
  const [filterType, setFilterType]   = useState<TransactionType | null>(null)

  const [sort, setSort] = useState<SortState>({ col: 'date', dir: 'desc' })

  const [modalOpen, setModalOpen]           = useState(false)
  const [editingTx, setEditingTx]           = useState<Transaction | null>(null)
  const [deletingId, setDeletingId]         = useState<string | null>(null)
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set())
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [selectMode, setSelectMode]         = useState(false)

  const hasFilters   = filterYear !== null || filterMonth !== null || filterType !== null
  const isThisMonth = filterYear === currentYear && filterMonth === currentMonth

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      if (filterYear)  query = query.eq('year',  filterYear)
      if (filterMonth) query = query.eq('month', filterMonth)
      if (filterType)  query = query.eq('type',  filterType)
      const { data, error } = await query
      if (!cancelled) {
        if (error) setError(error.message)
        else setTransactions(data ?? [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [filterYear, filterMonth, filterType, refresh])

  useEffect(() => { setSelectedIds(new Set()); setConfirmBulkDelete(false); setSelectMode(false) }, [filterYear, filterMonth, filterType])

  const aggregation = useMemo<AggGroup[]>(() => {
    const types = filterType ? [filterType] : TYPES
    return types
      .map((type) => {
        const group = transactions.filter((tx) => tx.type === type)
        const total = group.reduce((sum, tx) => sum + tx.amount, 0)
        const byCategory: Record<string, number> = {}
        for (const tx of group) byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount
        const rows = Object.entries(byCategory)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount)
        return { type, total, rows }
      })
      .filter((g) => g.total > 0)
  }, [transactions, filterType])

  const summaryGroups = useMemo(() =>
    aggregation
      .filter((g) => g.type !== 'savings')
      .sort((a) => (a.type === 'income' ? -1 : 1)),
    [aggregation],
  )

  const netSavings = useMemo(() => {
    if (filterType !== null) return null
    const income  = transactions.filter((tx) => tx.type === 'income') .reduce((s, tx) => s + tx.amount, 0)
    const expense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const savingsGroup = aggregation.find((g) => g.type === 'savings') ?? null
    return { net: income - expense, savingsGroup }
  }, [transactions, aggregation, filterType])

  interface GroupMeta { count: number; totalAmount: number; isSplit: boolean }
  const groupMeta = useMemo(() => {
    if (filterYear !== null || filterMonth !== null) return null
    const map = new Map<string, GroupMeta>()
    for (const tx of transactions) {
      const groupId = tx.recurrence_group_id ?? tx.split_group_id
      if (!groupId) continue
      const existing = map.get(groupId)
      if (existing) { existing.count++; existing.totalAmount += tx.amount }
      else map.set(groupId, { count: 1, totalAmount: tx.amount, isSplit: Boolean(tx.split_group_id) })
    }
    return map.size > 0 ? map : null
  }, [transactions, filterYear, filterMonth])

  const displayTransactions = useMemo(() => {
    let rows = transactions
    if (groupMeta) {
      const seen = new Set<string>()
      rows = transactions.filter((tx) => {
        const groupId = tx.recurrence_group_id ?? tx.split_group_id
        if (!groupId) return true
        if (seen.has(groupId)) return false
        seen.add(groupId)
        return true
      })
    }
    const { col, dir } = sort
    const mul = dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      if (col === 'date')     return mul * a.date.localeCompare(b.date)
      if (col === 'type')     return mul * (TYPE_ORDER[a.type] - TYPE_ORDER[b.type])
      if (col === 'category') return mul * a.category.localeCompare(b.category)
      if (col === 'amount') {
        const aAmt = (groupMeta?.get(a.recurrence_group_id ?? a.split_group_id ?? '')?.totalAmount) ?? a.amount
        const bAmt = (groupMeta?.get(b.recurrence_group_id ?? b.split_group_id ?? '')?.totalAmount) ?? b.amount
        return mul * (aAmt - bAmt)
      }
      return 0
    })
  }, [transactions, groupMeta, sort])

  function clearFilters() { setFilterYear(null); setFilterMonth(null); setFilterType(null) }

  function handleSort(col: SortCol) {
    setSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: col === 'date' || col === 'amount' ? 'desc' : 'asc' },
    )
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    setSelectedIds(
      selectedIds.size === displayTransactions.length
        ? new Set()
        : new Set(displayTransactions.map((tx) => tx.id)),
    )
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    const { error } = await supabase.from('transactions').delete().in('id', Array.from(selectedIds))
    if (error) { setError(error.message); return }
    setSelectedIds(new Set())
    setConfirmBulkDelete(false)
    setRefresh((r) => r + 1)
  }

  function stepMonth(dir: 1 | -1) {
    const baseYear  = filterYear  ?? currentYear
    const baseMonth = filterMonth ?? currentMonth
    let m = baseMonth + dir
    let y = baseYear
    if (m > 12) { m = 1;  y++ }
    if (m < 1)  { m = 12; y-- }
    setFilterYear(y)
    setFilterMonth(m)
  }
  function openAdd() { setEditingTx(null); setModalOpen(true) }
  function openEdit(tx: Transaction) { setDeletingId(null); setEditingTx(tx); setModalOpen(true) }
  function handleModalSaved() { setModalOpen(false); setEditingTx(null); setRefresh((r) => r + 1) }

  async function handleDelete(tx: Transaction, mode: 'single' | 'future' | 'all' = 'single') {
    const q = supabase.from('transactions').delete()
    let result
    if (mode === 'all') {
      if (tx.recurrence_group_id)   result = await q.eq('recurrence_group_id', tx.recurrence_group_id)
      else if (tx.split_group_id)   result = await q.eq('split_group_id', tx.split_group_id)
      else                          result = await q.eq('id', tx.id)
    } else if (mode === 'future') {
      if (tx.recurrence_group_id)   result = await q.eq('recurrence_group_id', tx.recurrence_group_id).gte('date', tx.date)
      else if (tx.split_group_id)   result = await q.eq('split_group_id', tx.split_group_id).gte('date', tx.date)
      else                          result = await q.eq('id', tx.id)
    } else {
      result = await q.eq('id', tx.id)
    }
    const { error } = result
    if (error) { setError(error.message); return }
    setDeletingId(null)
    setRefresh((r) => r + 1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="px-9 py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Transactions</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Log and manage your income, expenses, and savings.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-[14px] py-[9px] text-[13px] font-medium bg-terra text-white rounded-[10px] hover:opacity-90 transition-opacity shadow-terra"
          >
            + Add Transaction
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-border bg-red-soft px-4 py-3 text-sm text-red">
            {error}
          </div>
        )}

        {/* Filter bar — card per reference */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5 p-2.5 bg-surface border border-border rounded-[12px] shadow-card">
          {/* Year + Month selects with prev/next month arrows */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Year</span>
              <FilterSelect
                value={filterYear}
                onChange={setFilterYear}
                options={YEARS.map((y) => ({ value: y, label: String(y) }))}
                placeholder="All"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-ink-muted">Month</span>
              <FilterSelect
                value={filterMonth}
                onChange={setFilterMonth}
                options={MONTHS.map((m, i) => ({ value: i + 1, label: m }))}
                placeholder="All"
              />
            </div>
            <div className="flex items-center">
              <button
                onClick={() => stepMonth(-1)}
                aria-label="Previous month"
                className="p-1.5 rounded-l-[8px] text-ink-faint hover:text-ink hover:bg-surface-alt border border-border transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => stepMonth(1)}
                aria-label="Next month"
                className="p-1.5 rounded-r-[8px] text-ink-faint hover:text-ink hover:bg-surface-alt border border-l-0 border-border transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border" />

          {/* Quick filters */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (filterYear === currentYear && filterMonth === null) setFilterYear(null)
                else { setFilterYear(currentYear); setFilterMonth(null) }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filterYear === currentYear && filterMonth === null ? QUICK_ON : QUICK_OFF}`}
            >
              This Year
            </button>
            <button
              onClick={() => {
                if (isThisMonth) clearFilters()
                else { setFilterYear(currentYear); setFilterMonth(currentMonth) }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${isThisMonth ? QUICK_ON : QUICK_OFF}`}
            >
              This Month
            </button>
          </div>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium text-ink-faint hover:text-ink transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </button>
          )}

          {/* Type pills */}
          <div className="flex items-center gap-1.5 ml-auto">
            {([null, 'expense', 'income', 'savings'] as (TransactionType | null)[]).map((t) => {
              const key = t ?? 'all'
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${filterType === t ? TYPE_PILL_ON[key] : TYPE_PILL_OFF}`}
                >
                  {t ?? 'All'}
                </button>
              )
            })}
          </div>
        </div>

        {/* View tabs */}
        <div className="mt-5 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-1">
            {(['transactions', 'summary'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-1 pb-3 mr-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                  view === v
                    ? 'border-terra text-terra'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {view === 'transactions' && (
            <button
              onClick={() => { setSelectMode((m) => !m); setSelectedIds(new Set()); setConfirmBulkDelete(false) }}
              className={`mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-xs font-medium border transition-colors ${
                selectMode
                  ? 'bg-terra-soft border-border-strong text-terra'
                  : 'bg-surface border-border text-ink-muted hover:bg-surface-alt hover:text-ink'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {selectMode ? (
                  <>
                    <rect x="1" y="1" width="14" height="14" rx="3" />
                    <polyline points="4 8 7 11 12 5" />
                  </>
                ) : (
                  <rect x="1" y="1" width="14" height="14" rx="3" />
                )}
              </svg>
              {selectMode ? 'Exit Select' : 'Select'}
            </button>
          )}
        </div>

        {/* ── Transactions view ──────────────────────────────────────────── */}
        {view === 'transactions' && (
          <>
            {selectedIds.size > 0 && (
              <div className="mt-4 flex items-center justify-between gap-4 rounded-[12px] border border-border bg-red-soft px-4 py-2.5 flex-wrap">
                <span className="text-sm text-ink">
                  <span className="font-medium">{selectedIds.size}</span>{' '}
                  {selectedIds.size === 1 ? 'transaction' : 'transactions'} selected
                </span>
                <div className="flex items-center gap-2">
                  {confirmBulkDelete ? (
                    <>
                      <span className="text-sm text-ink-muted">
                        Permanently delete {selectedIds.size} {selectedIds.size === 1 ? 'transaction' : 'transactions'}?
                      </span>
                      <button onClick={handleBulkDelete} className="px-3 py-1.5 text-xs font-medium text-white bg-red hover:opacity-90 rounded-[8px] transition-opacity">Confirm</button>
                      <button onClick={() => setConfirmBulkDelete(false)} className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors">Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setConfirmBulkDelete(true)} className="px-3 py-1.5 text-xs font-medium text-white bg-red hover:opacity-90 rounded-[8px] transition-opacity">Delete selected</button>
                      <button onClick={() => { setSelectedIds(new Set()); setSelectMode(false) }} className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors">Exit Select</button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="mt-4 rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
            {loading ? (
              <div className="divide-y divide-border">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-[22px] py-[14px] animate-pulse">
                    <div className="h-4 w-24 rounded bg-surface-alt" />
                    <div className="h-5 w-16 rounded-full bg-surface-alt" />
                    <div className="h-4 w-28 rounded bg-surface-alt" />
                    <div className="ml-auto h-4 w-20 rounded bg-surface-alt" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {hasFilters ? (
                  <>
                    <p className="text-sm font-medium text-ink">No transactions match these filters</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-terra hover:opacity-70 transition-opacity">Clear filters</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-ink">No transactions yet</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      Click <span className="font-medium">+ Add Transaction</span> to log your first one.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-surface-alt">
                      {selectMode && (
                        <th className="py-[13px] pl-[22px] pr-2 w-px">
                          <input
                            type="checkbox"
                            checked={displayTransactions.length > 0 && selectedIds.size === displayTransactions.length}
                            onChange={toggleSelectAll}
                            className="rounded border-border text-terra focus:ring-terra focus:ring-offset-0"
                          />
                        </th>
                      )}
                      {(['date', 'type', 'category'] as SortCol[]).map((col) => (
                        <th key={col} className="text-left py-[13px] px-[22px] text-[11px] font-medium text-ink-muted uppercase tracking-[0.08em] whitespace-nowrap">
                          <button onClick={() => handleSort(col)} className="inline-flex items-center gap-1 hover:text-ink transition-colors capitalize">
                            {col}
                            <SortIcon active={sort.col === col} dir={sort.dir} />
                          </button>
                        </th>
                      ))}
                      <th className="text-right py-[13px] px-[22px] text-[11px] font-medium text-ink-muted uppercase tracking-[0.08em] whitespace-nowrap">
                        <button onClick={() => handleSort('amount')} className="inline-flex items-center gap-1 hover:text-ink transition-colors ml-auto">
                          Amount
                          <SortIcon active={sort.col === 'amount'} dir={sort.dir} />
                        </button>
                      </th>
                      <th className="text-left py-[13px] px-[22px] text-[11px] font-medium text-ink-muted uppercase tracking-[0.08em] hidden sm:table-cell">Note</th>
                      <th className="py-[13px] px-[22px] w-px" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayTransactions.map((tx) => {
                      const txGroupId       = tx.recurrence_group_id ?? tx.split_group_id
                      const meta            = txGroupId ? groupMeta?.get(txGroupId) : undefined
                      const isCollapsed     = Boolean(meta)
                      const displayAmount   = meta?.isSplit ? meta.totalAmount : tx.amount
                      const btnDel = 'text-xs font-medium text-red hover:opacity-70 transition-opacity'
                      return deletingId === tx.id ? (
                        <tr key={tx.id} className="bg-red-soft">
                          <td colSpan={selectMode ? 7 : 6} className="py-3 px-[22px]">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="text-sm text-ink-muted">
                                {isCollapsed && meta?.isSplit
                                  ? <>Delete all <span className="font-medium text-ink">{meta.count}</span> installments of <span className="font-medium text-ink">{tx.category}</span> ({formatCurrency(meta.totalAmount)} total)?</>
                                  : isCollapsed
                                  ? <>Delete all <span className="font-medium text-ink">{meta?.count}</span> occurrences of <span className="font-medium text-ink">{tx.category}</span>?</>
                                  : tx.recurrence
                                  ? <>Delete <span className="font-medium text-ink capitalize">{tx.recurrence}</span> recurring — {formatCurrency(tx.amount)}?</>
                                  : tx.split_group_id
                                  ? <>Delete this installment of <span className="font-medium text-ink">{tx.category}</span> — {formatCurrency(tx.amount)}?</>
                                  : <>Delete <span className="font-medium text-ink">{tx.category}</span> — {formatCurrency(tx.amount)}?</>
                                }
                              </span>
                              {isCollapsed ? (
                                <button onClick={() => handleDelete(tx, 'all')} className={btnDel}>Delete all</button>
                              ) : (tx.recurrence || tx.split_group_id) ? (
                                <>
                                  <button onClick={() => handleDelete(tx, 'single')} className={btnDel}>This only</button>
                                  <button onClick={() => handleDelete(tx, 'future')} className={btnDel}>This &amp; future</button>
                                </>
                              ) : (
                                <button onClick={() => handleDelete(tx)} className={btnDel}>Delete</button>
                              )}
                              <button onClick={() => setDeletingId(null)} className="text-xs font-medium text-ink-faint hover:text-ink transition-colors">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={tx.id} className={`transition-colors group ${selectedIds.has(tx.id) ? 'bg-terra-soft' : 'hover:bg-surface-alt'}`}>
                          {selectMode && (
                            <td className="py-[14px] pl-[22px] pr-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(tx.id)}
                                onChange={() => toggleSelect(tx.id)}
                                className="rounded border-border text-terra focus:ring-terra focus:ring-offset-0"
                              />
                            </td>
                          )}
                          <td className="py-[14px] px-[22px] text-[13.5px] text-ink-muted whitespace-nowrap">{formatDate(tx.date)}</td>
                          <td className="py-[14px] px-[22px]"><TypeBadge type={tx.type} /></td>
                          <td className="py-[14px] px-[22px] text-[13.5px] text-ink">
                            <div className="flex items-center gap-2 flex-wrap">
                              {tx.category}
                              {tx.recurrence && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10.5px] font-medium font-mono bg-terra-soft text-terra whitespace-nowrap">
                                  ↻ {tx.recurrence}
                                </span>
                              )}
                              {tx.split_group_id && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[10.5px] font-medium font-mono bg-amber-soft text-amber whitespace-nowrap">
                                  ÷ {meta ? `${meta.count}mo` : 'spread'}
                                </span>
                              )}
                              {isCollapsed && !meta?.isSplit && meta && meta.count > 1 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-surface-alt text-ink-faint whitespace-nowrap">
                                  ×{meta.count}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className={`py-[14px] px-[22px] text-right text-[13.5px] font-medium num whitespace-nowrap ${AMOUNT_COLOR[tx.type]}`}>
                            {formatCurrency(displayAmount)}
                          </td>
                          <td className="py-[14px] px-[22px] text-[13.5px] text-ink-muted hidden sm:table-cell">
                            {tx.note ? <span className="block max-w-xs truncate">{tx.note}</span> : <span className="text-ink-faint">—</span>}
                          </td>
                          <td className="py-[14px] px-[22px]">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(tx)} aria-label="Edit transaction" className="p-1 text-ink-faint hover:text-ink transition-colors"><PencilIcon /></button>
                              <button onClick={() => { setDeletingId(tx.id); setModalOpen(false) }} aria-label="Delete transaction" className="p-1 text-ink-faint hover:text-red transition-colors"><TrashIcon /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          </>
        )}

        {/* ── Summary view ──────────────────────────────────────────────── */}
        {view === 'summary' && (
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="rounded-[18px] border border-border bg-surface shadow-card divide-y divide-border">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse space-y-2">
                    <div className="flex justify-between">
                      <div className="h-5 w-20 rounded-full bg-surface-alt" />
                      <div className="h-5 w-24 rounded bg-surface-alt" />
                    </div>
                    <div className="h-1 w-full rounded-full bg-surface-alt" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-[18px] border border-border bg-surface shadow-card flex flex-col items-center justify-center py-16 text-center">
                {hasFilters ? (
                  <>
                    <p className="text-sm font-medium text-ink">No transactions match these filters</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-terra hover:opacity-70 transition-opacity">Clear filters</button>
                  </>
                ) : (
                  <p className="text-sm font-medium text-ink">No transactions to summarise yet</p>
                )}
              </div>
            ) : (
              <>
                {summaryGroups.map((group) => (
                  <SummaryGroup key={group.type} group={group} />
                ))}

                {netSavings && (
                  <NetSavingsCard
                    netAmount={netSavings.net}
                    savingsGroup={netSavings.savingsGroup}
                  />
                )}

                {filterType === 'savings' && (
                  <div className="rounded-[18px] border border-border bg-surface shadow-card px-5 py-6 text-center">
                    <p className="text-sm text-ink-muted">
                      Savings appear within the Net Savings section.{' '}
                      <button onClick={clearFilters} className="text-terra font-medium hover:opacity-70 transition-opacity">
                        Clear the filter
                      </button>{' '}
                      to see the full summary.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        transaction={editingTx}
        onClose={() => { setModalOpen(false); setEditingTx(null) }}
        onSaved={handleModalSaved}
      />
    </>
  )
}
