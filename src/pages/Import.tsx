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
  income:  'text-forest',
  expense: 'text-red',
  savings: 'text-terra',
}

const TYPE_COLORS: Record<TransactionType, string> = {
  expense: 'bg-red-soft text-red',
  income:  'bg-forest-soft text-forest',
  savings: 'bg-terra-soft text-terra',
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
  const [successCount, setSuccessCount]     = useState<number | null>(null)
  const [pendingSave, setPendingSave]       = useState<PendingSave[]>([])
  const [savingMappings, setSavingMappings] = useState(false)

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
      setError('No transactions found. Check that your lines follow the format: - 25 food')
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
    <div className="px-9 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Import Transactions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Paste your notes-app expense list to bulk import a month of transactions.
        </p>
      </div>

      {successCount !== null && (
        <div className="rounded-[10px] border border-border bg-forest-soft px-4 py-3 text-sm text-forest mb-4">
          Successfully imported {successCount} transaction{successCount !== 1 ? 's' : ''}.
        </div>
      )}

      {error && (
        <div className="rounded-[10px] border border-border bg-red-soft px-4 py-3 text-sm text-red mb-4">
          {error}
        </div>
      )}

      {/* Post-import: save mappings prompt */}
      {pendingSave.length > 0 && step === 'input' && (
        <div className="mb-6 rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-ink">Save as auto-mappings?</h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                These notes were manually categorized. Save them so future imports are categorized automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setPendingSave([])}
                className="text-xs font-medium text-ink-muted hover:text-ink transition-colors"
              >
                Skip
              </button>
              <button
                onClick={handleSaveMappings}
                disabled={savingMappings || pendingSave.length === 0}
                className="px-3 py-1.5 text-xs font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {savingMappings ? 'Saving…' : `Save ${pendingSave.length} mapping${pendingSave.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {pendingSave.map((ps, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-2.5">
                <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-xs font-mono text-ink-muted truncate">{ps.note}</span>
                  <span className="text-xs text-ink-faint">→</span>
                  <span className="text-xs font-medium text-ink">{ps.category}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium ${TYPE_COLORS[ps.type]}`}>
                    {ps.type}
                  </span>
                </div>
                <button
                  onClick={() => setPendingSave((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-ink-faint hover:text-ink text-sm leading-none transition-colors"
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
        <div className="space-y-5">

          {/* Month + Year */}
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="text-sm pl-3 pr-8 py-2 rounded-[10px] border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra appearance-none"
              >
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-24 text-sm px-3 py-2 rounded-[10px] border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra"
              />
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Paste your notes
            </label>
            <textarea
              value={rawText}
              onChange={(e) => { setRawText(e.target.value); setError(null) }}
              rows={16}
              spellCheck={false}
              placeholder={"- 25 food\n- 100 amazon\n+ 2400 salary"}
              className="w-full text-sm font-mono px-4 py-3 rounded-[18px] border border-border bg-surface text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-terra resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleParse}
              disabled={!rawText.trim()}
              className="px-5 py-2 text-sm font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
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
        <div className="space-y-4">

          {/* Stats bar */}
          <div className="rounded-[18px] border border-border bg-surface shadow-card px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-sm font-medium text-ink">
              {MONTHS[month - 1]} {year}
            </span>
            <span className="h-4 w-px bg-border" />
            <span className="text-sm text-ink-muted">
              <span className="font-medium text-ink">{selectedRows.length}</span> of {rows.length} selected
            </span>
            {stats.expenseCount > 0 && (
              <>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-red num">
                  −{formatCurrency(stats.expenseTotal)} expenses
                </span>
              </>
            )}
            {stats.incomeCount > 0 && (
              <>
                <span className="h-4 w-px bg-border" />
                <span className="text-sm text-forest num">
                  +{formatCurrency(stats.incomeTotal)} income
                </span>
              </>
            )}
            {stats.uncertainCount > 0 && (
              <>
                <span className="h-4 w-px bg-border" />
                <span className="inline-flex items-center gap-1.5 text-sm text-amber">
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
                className="px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selectedRows.length === 0}
                className="px-5 py-2 text-sm font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {importing ? 'Importing…' : `Import ${selectedRows.length} transaction${selectedRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          {/* Uncertainty hint */}
          {stats.uncertainCount > 0 && (
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-faint text-center">
              <svg className="mt-px shrink-0 w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="8" cy="8" r="7" />
                <line x1="8" y1="7" x2="8" y2="11" />
                <circle cx="8" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              Rows highlighted in amber couldn't be matched to a category automatically. Check the dropdown and click <span className="font-medium text-amber">?</span> to confirm, or click anywhere on the row to mark it as reviewed.
            </p>
          )}

          {/* Review table */}
          <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-alt">
                    <th className="py-3 pl-5 pr-2 w-px">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => setRows((prev) => prev.map((r) => ({ ...r, include: e.target.checked })))}
                        className="rounded border-border text-terra focus:ring-terra focus:ring-offset-0"
                      />
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-ink-muted whitespace-nowrap">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-muted">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-muted">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-ink-muted">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
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
                          ? 'cursor-pointer bg-amber-soft hover:opacity-90'
                          : 'cursor-pointer hover:bg-surface-alt'
                      }`}
                    >
                      <td className="py-2.5 pl-5 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={row.include}
                          onChange={(e) => updateRow(row.id, { include: e.target.checked })}
                          className="rounded border-border text-terra focus:ring-terra focus:ring-offset-0"
                        />
                      </td>
                      <td className={`py-2.5 px-4 text-right font-medium num whitespace-nowrap ${AMOUNT_COLOR[row.type]}`}>
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
                          className="text-xs px-2 py-1 rounded-[6px] border border-border bg-surface-alt text-ink focus:outline-none focus:ring-1 focus:ring-terra"
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
                            className="text-xs px-2 py-1 rounded-[6px] border border-border bg-surface-alt text-ink focus:outline-none focus:ring-1 focus:ring-terra"
                          >
                            {categoriesFor(row.type).map((c) => (
                              <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                          {!row.confident ? (
                            <button
                              onClick={() => updateRow(row.id, { confident: true })}
                              title="Mark as reviewed"
                              className="inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium bg-amber-soft text-amber hover:opacity-80 whitespace-nowrap transition-opacity"
                            >
                              ?
                            </button>
                          ) : (
                            <button
                              onClick={() => updateRow(row.id, { confident: false })}
                              title="Mark as needs review"
                              className="invisible group-hover:visible inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium text-ink-faint hover:text-amber transition-colors"
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
                          className="w-full min-w-48 text-xs px-2 py-1 rounded-[6px] border border-transparent hover:border-border focus:border-border bg-transparent focus:bg-surface focus:outline-none focus:ring-1 focus:ring-terra text-ink-muted transition-colors"
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
