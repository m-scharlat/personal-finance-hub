import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'
import InfoTooltip from '../components/InfoTooltip'
import type { Category, ImportMapping, TransactionType } from '../types'

// ── Parser ────────────────────────────────────────────────────────────────

const LINE_RE = /([+-])\s*(\d+)\$?\s+(.+)/

interface ParsedRow {
  id: string
  include: boolean
  amount: number
  type: TransactionType
  category: string
  confident: boolean
  wasUncertain: boolean
  note: string
}

interface PendingSave {
  note: string
  type: TransactionType
  category: string
}

function suggestCategory(note: string, type: TransactionType, cats: Category[]): { category: string; confident: boolean } {
  const s = note.toLowerCase()
  let name: string
  let confident = true

  if (type === 'income') {
    if (/salary|wage/.test(s))                    name = 'Salary'
    else if (/freelance|consult|contract/.test(s)) name = 'Freelance'
    else if (/bonus/.test(s))                      name = 'Bonus'
    else if (/dividend/.test(s))                   name = 'Dividends'
    else if (/rental|rent income/.test(s))         name = 'Rental Income'
    else { name = 'Other Income'; confident = false }
  } else {
    if (/doctor|pharmacy|medicine|medical|finasteride|prescription|dental/.test(s))                    name = 'Healthcare'
    else if (/lyft|uber|taxi|\bcab\b|\bride\b|\btrain\b|\bbus\b|transit|subway/.test(s))               name = 'Transport'
    else if (/snack|food|lunch|dinner|breakfast|bagel|coffee|dunkin|cafe|meal|restaurant|veggie|eat/.test(s)) name = 'Food & Dining'
    else if (/amazon|\bshop\b/.test(s))            name = 'Shopping'
    else if (/netflix|spotify|subscription/.test(s)) name = 'Subscriptions'
    else if (/\brent\b|housing|mortgage/.test(s))  name = 'Rent & Housing'
    else if (/movie|concert|entertain/.test(s))    name = 'Entertainment'
    else if (/school|course|education/.test(s))    name = 'Education'
    else { name = 'Other'; confident = false }
  }

  const available = cats.filter((c) => c.type === type)
  if (!available.find((c) => c.name === name)) {
    name = available.find((c) => c.name.toLowerCase().includes('other'))?.name ?? available[0]?.name ?? name
  }
  return { category: name, confident }
}

function parseText(text: string, cats: Category[], mappings: ImportMapping[]): ParsedRow[] {
  return text
    .split('\n')
    .map((line) => line.match(LINE_RE))
    .filter(Boolean)
    .map((m) => {
      const [, sign, amountStr, desc] = m!
      const signType: TransactionType = sign === '+' ? 'income' : 'expense'
      const note = desc.trim()
      const lowerNote = note.toLowerCase()

      // Check saved mappings first (exact match, case-insensitive)
      const mappingMatch = mappings.find((mp) =>
        mp.triggers.some((t) => t.toLowerCase() === lowerNote),
      )
      if (mappingMatch) {
        return {
          id: crypto.randomUUID(),
          include: true,
          amount: parseInt(amountStr, 10),
          type: mappingMatch.type,
          category: mappingMatch.category,
          confident: true,
          wasUncertain: false,
          note,
        }
      }

      const { category, confident } = suggestCategory(note, signType, cats)
      return {
        id: crypto.randomUUID(),
        include: true,
        amount: parseInt(amountStr, 10),
        type: signType,
        category,
        confident,
        wasUncertain: !confident,
        note,
      }
    })
}

// ── Constants ─────────────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const now = new Date()

// ── Page ──────────────────────────────────────────────────────────────────

type Step = 'input' | 'review'

const AMOUNT_COLOR: Record<TransactionType, string> = {
  income:  'text-green-600  dark:text-green-400',
  expense: 'text-red-600    dark:text-red-400',
  savings: 'text-indigo-600 dark:text-indigo-400',
}

const TYPE_COLORS: Record<TransactionType, string> = {
  expense: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
  income:  'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800',
  savings: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
}

export default function Import() {
  const [step, setStep]             = useState<Step>('input')
  const [rawText, setRawText]       = useState('')
  const [month, setMonth]           = useState(now.getMonth() + 1)
  const [year, setYear]             = useState(now.getFullYear())
  const [rows, setRows]             = useState<ParsedRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [mappings, setMappings]     = useState<ImportMapping[]>([])
  const [importing, setImporting]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [successCount, setSuccessCount]       = useState<number | null>(null)
  const [pendingSave, setPendingSave]         = useState<PendingSave[]>([])
  const [savingMappings, setSavingMappings]   = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').order('type').order('name'),
      supabase.from('import_mappings').select('*').order('created_at'),
    ]).then(([{ data: cats }, { data: maps }]) => {
      if (cats) setCategories(cats)
      if (maps) setMappings(maps)
    })
  }, [])

  function categoriesFor(type: TransactionType) {
    return categories.filter((c) => c.type === type)
  }

  function handleParse() {
    const parsed = parseText(rawText, categories, mappings)
    if (parsed.length === 0) {
      setError('No transactions found. Check that your lines follow the format: - [x] - 25 food')
      return
    }
    setError(null)
    setSuccessCount(null)
    setPendingSave([])
    setRows(parsed)
    setStep('review')
  }

  function updateRow(id: string, patch: Partial<ParsedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  const selectedRows = useMemo(() => rows.filter((r) => r.include), [rows])
  const allChecked   = rows.length > 0 && rows.every((r) => r.include)

  async function handleImport() {
    if (selectedRows.length === 0) return
    setImporting(true)
    setError(null)
    const dateStr = `${year}-${String(month).padStart(2, '0')}-01`
    const records = selectedRows.map(({ amount, type, category, note }) => ({
      amount,
      type,
      category,
      note: note || null,
      date: dateStr,
    }))
    const { error: err } = await supabase.from('transactions').insert(records)
    setImporting(false)
    if (err) { setError(err.message); return }

    // Collect rows that were originally uncertain but the user confirmed
    const candidates = selectedRows.filter((r) => r.wasUncertain && r.confident)
    if (candidates.length > 0) {
      setPendingSave(candidates.map((r) => ({ note: r.note, type: r.type, category: r.category })))
    }

    setSuccessCount(selectedRows.length)
    setStep('input')
    setRawText('')
    setRows([])
  }

  async function handleSaveMappings() {
    setSavingMappings(true)
    const records = pendingSave.map((ps) => ({
      triggers: [ps.note],
      category: ps.category,
      type: ps.type,
    }))
    const { error: err } = await supabase.from('import_mappings').insert(records)
    setSavingMappings(false)
    if (err) { setError(err.message); return }
    setPendingSave([])
    // Reload mappings so they apply on next parse in this session
    supabase.from('import_mappings').select('*').order('created_at').then(({ data }) => {
      if (data) setMappings(data)
    })
  }

  // ── Stats for review header ───────────────────────────────────────────

  const stats = useMemo(() => {
    const expenses  = selectedRows.filter((r) => r.type === 'expense')
    const income    = selectedRows.filter((r) => r.type === 'income')
    const uncertain = rows.filter((r) => !r.confident)
    return {
      expenseCount:   expenses.length,
      incomeCount:    income.length,
      expenseTotal:   expenses.reduce((s, r) => s + r.amount, 0),
      incomeTotal:    income.reduce((s, r) => s + r.amount, 0),
      uncertainCount: uncertain.length,
    }
  }, [selectedRows, rows])

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Import Transactions</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Paste your notes-app expense list to bulk import a month of transactions.
        </p>
      </div>

      {successCount !== null && (
        <div className="mt-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Successfully imported {successCount} transaction{successCount !== 1 ? 's' : ''}.
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Post-import: save mappings prompt */}
      {pendingSave.length > 0 && step === 'input' && (
        <div className="mt-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-900/40 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Save as auto-mappings?</h3>
              <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
                These notes were manually categorized. Save them so future imports are categorized automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPendingSave([])}
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSaveMappings}
                disabled={savingMappings || pendingSave.length === 0}
                className="px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {savingMappings ? 'Saving…' : `Save ${pendingSave.length} mapping${pendingSave.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
          <ul className="divide-y divide-amber-100 dark:divide-amber-900/30">
            {pendingSave.map((ps, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{ps.note}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">→</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">{ps.category}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${TYPE_COLORS[ps.type]}`}>
                    {ps.type}
                  </span>
                </div>
                <button
                  onClick={() => setPendingSave((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 text-sm leading-none transition-colors"
                  title="Remove from list"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Step 1: Input ─────────────────────────────────────────────── */}
      {step === 'input' && (
        <div className="mt-6 space-y-5">

          {/* Month + Year */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="text-sm pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              Paste your notes
            </label>
            <textarea
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setError(null) }}
              rows={16}
              spellCheck={false}
              placeholder={"- 25 food\n- 100 amazon\n+ 2400 salary"}
              className="w-full text-sm font-mono px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Parse transactions →
            </button>
            <InfoTooltip
              align="right"
              direction="up"
              text={
                "One transaction per line:\n" +
                "  - for expenses, + for income\n\n" +
                "Examples:\n" +
                "-25 coffee\n" +
                "-120 electric bill\n" +
                "+2400 salary\n\n" +
                "Descriptions are matched against your import mappings to auto-assign categories. Unmatched lines are flagged for review."
              }
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Review ────────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="mt-6 space-y-4">

          {/* Stats bar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {MONTHS[month - 1]} {year}
            </span>
            <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{selectedRows.length}</span> of {rows.length} selected
            </span>
            {stats.expenseCount > 0 && (
              <>
                <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm text-red-600 dark:text-red-400 tabular-nums">
                  −{formatCurrency(stats.expenseTotal)} expenses
                </span>
              </>
            )}
            {stats.incomeCount > 0 && (
              <>
                <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-sm text-green-600 dark:text-green-400 tabular-nums">
                  +{formatCurrency(stats.incomeTotal)} income
                </span>
              </>
            )}
            {stats.uncertainCount > 0 && (
              <>
                <span className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
                <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="8" cy="8" r="7" />
                    <line x1="8" y1="5" x2="8" y2="8.5" />
                    <circle cx="8" cy="11" r="0.5" fill="currentColor" />
                  </svg>
                  {stats.uncertainCount} need{stats.uncertainCount === 1 ? 's' : ''} review
                </span>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => { setStep('input'); setError(null) }}
                className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedRows.length === 0}
                className="px-5 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importing…' : `Import ${selectedRows.length} transaction${selectedRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {/* Uncertainty hint */}
          {stats.uncertainCount > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 text-center">
              <svg className="mt-px shrink-0 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="7" />
                <line x1="8" y1="7" x2="8" y2="11" />
                <circle cx="8" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              Rows highlighted in amber couldn't be matched to a category automatically. Check the dropdown and click <span className="font-medium text-amber-500 dark:text-amber-400">?</span> to confirm, or click anywhere on the row to mark it as reviewed.
            </p>
          )}

          {/* Review table */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 pl-5 pr-2 w-px">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, include: e.target.checked })))}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('input, select, button')) return
                        updateRow(row.id, { confident: !row.confident })
                      }}
                      className={`group transition-colors ${
                        !row.include
                          ? 'opacity-40'
                          : !row.confident
                          ? 'cursor-pointer bg-amber-50/60 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40'
                      }`}
                    >
                      <td className="py-2.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                          className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                      </td>
                      <td className={`py-2.5 px-4 text-right font-medium tabular-nums whitespace-nowrap ${AMOUNT_COLOR[row.type]}`}>
                        {row.type === 'income' ? '+' : '−'}{formatCurrency(row.amount)}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={row.type}
                          onChange={(e) => {
                            const newType = e.target.value as TransactionType
                            const { category, confident } = suggestCategory(row.note, newType, categories)
                            updateRow(row.id, { type: newType, category, confident })
                          }}
                          className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="expense">expense</option>
                          <option value="income">income</option>
                          <option value="savings">savings</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={row.category}
                            onChange={(e) => updateRow(row.id, { category: e.target.value, confident: true })}
                            className="text-xs px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {categoriesFor(row.type).map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          {!row.confident ? (
                            <button
                              onClick={() => updateRow(row.id, { confident: true })}
                              title="Mark as reviewed"
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/60 whitespace-nowrap transition-colors"
                            >
                              ?
                            </button>
                          ) : (
                            <button
                              onClick={() => updateRow(row.id, { confident: false })}
                              title="Mark as needs review"
                              className="invisible group-hover:visible inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-400 transition-colors"
                            >
                              ?
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateRow(row.id, { note: e.target.value })}
                          className="w-full min-w-48 text-xs px-2 py-1 rounded-md border border-transparent hover:border-gray-200 dark:hover:border-gray-700 focus:border-gray-200 dark:focus:border-gray-700 bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-600 dark:text-gray-400 transition-colors"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
