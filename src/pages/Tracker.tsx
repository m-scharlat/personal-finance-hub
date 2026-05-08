import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/format'
import TransactionModal from '../components/TransactionModal'
import type { Transaction, TransactionType } from '../types'

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: currentYear - 2025 }, (_, i) => 2026 + i)
const TYPES: TransactionType[] = ['income', 'expense', 'savings']

// ── Types ─────────────────────────────────────────────────────────────────────

type ViewMode = 'transactions' | 'summary'
interface AggRow   { category: string; amount: number }
interface AggGroup { type: TransactionType; total: number; rows: AggRow[] }

// ── Styles ───────────────────────────────────────────────────────────────────

const TYPE_BADGE: Record<TransactionType, string> = {
  income:  'bg-green-50  text-green-700  dark:bg-green-950  dark:text-green-400',
  expense: 'bg-red-50    text-red-700    dark:bg-red-950    dark:text-red-400',
  savings: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
}

const AMOUNT_COLOR: Record<TransactionType, string> = {
  income:  'text-green-600  dark:text-green-400',
  expense: 'text-red-600    dark:text-red-400',
  savings: 'text-indigo-600 dark:text-indigo-400',
}

const BAR_COLOR: Record<TransactionType, string> = {
  income:  'bg-green-400  dark:bg-green-500',
  expense: 'bg-red-400    dark:bg-red-500',
  savings: 'bg-indigo-400 dark:bg-indigo-500',
}

const TYPE_PILL_ON: Record<string, string> = {
  all:     'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900',
  expense: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  income:  'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  savings: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
}

const TYPE_PILL_OFF =
  'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800'

const SELECT =
  'text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium capitalize ${TYPE_BADGE[type]}`}>
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

function SummaryGroup({ group }: { group: AggGroup }) {
  const { type, total, rows } = group
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <TypeBadge type={type} />
        <span className={`text-lg font-semibold tabular-nums ${AMOUNT_COLOR[type]}`}>
          {formatCurrency(total)}
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {rows.map((row) => {
          const pct = total > 0 ? (row.amount / total) * 100 : 0
          return (
            <div key={row.category} className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-900 dark:text-white">{row.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">{pct.toFixed(1)}%</span>
                  <span className={`text-sm font-medium tabular-nums ${AMOUNT_COLOR[type]}`}>
                    {formatCurrency(row.amount)}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
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

  // Bars relative to net when surplus; relative to allocated when deficit or zero net
  const barBase = !isDeficit && netAmount > 0 ? netAmount : totalAllocated

  // Unallocated only makes sense when net is positive
  const unallocated = !isDeficit && savingsGroup ? netAmount - totalAllocated : null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Net Savings</span>
          {isDeficit && savingsGroup && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
              Savings during deficit
            </span>
          )}
        </div>
        <span className={`text-lg font-semibold tabular-nums ${
          isDeficit ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
        }`}>
          {isDeficit ? '−' : '+' }{formatCurrency(Math.abs(netAmount))}
        </span>
      </div>

      {/* Savings breakdown */}
      {savingsGroup ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {savingsGroup.rows.map((row) => {
            const pct = barBase > 0 ? (row.amount / barBase) * 100 : 0
            return (
              <div key={row.category} className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-900 dark:text-white">{row.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium tabular-nums text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(row.amount)}
                    </span>
                  </div>
                </div>
                <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 dark:bg-indigo-500 rounded-full"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}

          {/* Unallocated — only when net is positive */}
          {unallocated !== null && unallocated > 0 && (
            <div className="px-5 py-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Unallocated</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500">
                    {((unallocated / netAmount) * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm font-medium tabular-nums text-gray-600 dark:text-gray-300">
                    {formatCurrency(unallocated)}
                  </span>
                </div>
              </div>
              <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-300 dark:bg-gray-600 rounded-full"
                  style={{ width: `${(unallocated / netAmount) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Deficit callout */}
          {isDeficit && (
            <div className="px-5 py-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/20">
              These savings were drawn from an existing balance during a deficit period.
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-600">
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
  const [filterYear, setFilterYear]   = useState<number | null>(null)
  const [filterMonth, setFilterMonth] = useState<number | null>(null)
  const [filterType, setFilterType]   = useState<TransactionType | null>(null)

  const [modalOpen, setModalOpen]   = useState(false)
  const [editingTx, setEditingTx]   = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const hasFilters = filterYear !== null || filterMonth !== null || filterType !== null

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

  // Per-type aggregation (income + expense only for cards; savings lives in Net Savings)
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

  // Income + expense cards in summary (savings excluded — shown in Net Savings card)
  const summaryGroups = useMemo(() =>
    aggregation
      .filter((g) => g.type !== 'savings')
      .sort((a) => (a.type === 'income' ? -1 : 1)),
    [aggregation],
  )

  // Net Savings (only computable when no type filter)
  const netSavings = useMemo(() => {
    if (filterType !== null) return null
    const income  = transactions.filter((tx) => tx.type === 'income') .reduce((s, tx) => s + tx.amount, 0)
    const expense = transactions.filter((tx) => tx.type === 'expense').reduce((s, tx) => s + tx.amount, 0)
    const savingsGroup = aggregation.find((g) => g.type === 'savings') ?? null
    return { net: income - expense, savingsGroup }
  }, [transactions, aggregation, filterType])

  function clearFilters() { setFilterYear(null); setFilterMonth(null); setFilterType(null) }
  function openAdd() { setEditingTx(null); setModalOpen(true) }
  function openEdit(tx: Transaction) { setDeletingId(null); setEditingTx(tx); setModalOpen(true) }
  function handleModalSaved() { setModalOpen(false); setEditingTx(null); setRefresh((r) => r + 1) }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setDeletingId(null)
    setRefresh((r) => r + 1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Transactions</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Log and manage your income, expenses, and savings.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Transaction
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filterYear ?? ''} onChange={(e) => setFilterYear(e.target.value ? Number(e.target.value) : null)} className={SELECT}>
              <option value="">All Years</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filterMonth ?? ''} onChange={(e) => setFilterMonth(e.target.value ? Number(e.target.value) : null)} className={SELECT}>
              <option value="">All Months</option>
              {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            {([null, 'expense', 'income', 'savings'] as (TransactionType | null)[]).map((t) => {
              const key = t ?? 'all'
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${filterType === t ? TYPE_PILL_ON[key] : TYPE_PILL_OFF}`}
                >
                  {t ?? 'All'}
                </button>
              )
            })}
          </div>
        </div>

        {/* View tabs */}
        <div className="mt-5 flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
          {(['transactions', 'summary'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-1 pb-3 mr-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                view === v
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Transactions view ──────────────────────────────────────────── */}
        {view === 'transactions' && (
          <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="h-5 w-16 rounded-md bg-gray-100 dark:bg-gray-800" />
                    <div className="h-4 w-28 rounded bg-gray-100 dark:bg-gray-800" />
                    <div className="ml-auto h-4 w-20 rounded bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {hasFilters ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No transactions match these filters</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Clear filters</button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No transactions yet</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Click <span className="font-medium">+ Add Transaction</span> to log your first one.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left py-3 px-5 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Note</th>
                      <th className="py-3 px-4 w-px" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {transactions.map((tx) =>
                      deletingId === tx.id ? (
                        <tr key={tx.id} className="bg-red-50 dark:bg-red-950/20">
                          <td colSpan={6} className="py-3 px-5">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Delete <span className="font-medium text-gray-900 dark:text-white">{tx.category}</span> — {formatCurrency(tx.amount)}?
                              </span>
                              <button onClick={() => handleDelete(tx.id)} className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">Delete</button>
                              <button onClick={() => setDeletingId(null)} className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">Cancel</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors group">
                          <td className="py-3 px-5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(tx.date)}</td>
                          <td className="py-3 px-4"><TypeBadge type={tx.type} /></td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{tx.category}</td>
                          <td className={`py-3 px-4 text-right font-medium tabular-nums whitespace-nowrap ${AMOUNT_COLOR[tx.type]}`}>{formatCurrency(tx.amount)}</td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                            {tx.note ? <span className="block max-w-xs truncate">{tx.note}</span> : <span className="text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(tx)} aria-label="Edit transaction" className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"><PencilIcon /></button>
                              <button onClick={() => { setDeletingId(tx.id); setModalOpen(false) }} aria-label="Delete transaction" className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"><TrashIcon /></button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Summary view ──────────────────────────────────────────────── */}
        {view === 'summary' && (
          <div className="mt-4 space-y-4">
            {loading ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-4 animate-pulse space-y-2">
                    <div className="flex justify-between">
                      <div className="h-5 w-20 rounded-md bg-gray-100 dark:bg-gray-800" />
                      <div className="h-5 w-24 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                    <div className="h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col items-center justify-center py-16 text-center">
                {hasFilters ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No transactions match these filters</p>
                    <button onClick={clearFilters} className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">Clear filters</button>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">No transactions to summarise yet</p>
                )}
              </div>
            ) : (
              <>
                {/* Income and Expense cards */}
                {summaryGroups.map((group) => (
                  <SummaryGroup key={group.type} group={group} />
                ))}

                {/* Net Savings card */}
                {netSavings && (
                  <NetSavingsCard
                    netAmount={netSavings.net}
                    savingsGroup={netSavings.savingsGroup}
                  />
                )}

                {/* Savings type filter redirect */}
                {filterType === 'savings' && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-6 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Savings appear within the Net Savings section.{' '}
                      <button onClick={clearFilters} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
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
