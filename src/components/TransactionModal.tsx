import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/format'
import type { Category, Transaction, TransactionType, Recurrence } from '../types'

type Duration = '3m' | '6m' | '1y'

const DURATION_LABELS: Record<Duration, string> = {
  '3m': '3 months',
  '6m': '6 months',
  '1y': '1 year',
}

const SPLIT_MONTH_OPTIONS = [2, 3, 4, 6, 12]

interface Props {
  open: boolean
  transaction: Transaction | null
  onClose: () => void
  onSaved: () => void
}

const TYPE_ACTIVE: Record<TransactionType, string> = {
  expense: 'bg-red-600    text-white',
  income:  'bg-green-600  text-white',
  savings: 'bg-indigo-600 text-white',
}

const FIELD = [
  'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2',
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
].join(' ')

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

function computeOccurrenceCount(recurrence: Recurrence, startDate: string, duration: Duration): number {
  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(start)
  if (duration === '3m')      end.setMonth(end.getMonth() + 3)
  else if (duration === '6m') end.setMonth(end.getMonth() + 6)
  else if (duration === '1y') end.setFullYear(end.getFullYear() + 1)
  else                         end.setFullYear(end.getFullYear() + 1)
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    count++
    if (recurrence === 'weekly')       cur.setDate(cur.getDate() + 7)
    else if (recurrence === 'monthly') cur.setMonth(cur.getMonth() + 1)
    else                               cur.setFullYear(cur.getFullYear() + 1)
  }
  return count
}

function generateRecurringOccurrences(
  base: { type: TransactionType; amount: number; category: string; note: string | null; recurrence: Recurrence },
  startDate: string,
  duration: Duration,
  groupId: string,
) {
  const start = new Date(startDate + 'T00:00:00')
  const end   = new Date(start)
  if (duration === '3m')      end.setMonth(end.getMonth() + 3)
  else if (duration === '6m') end.setMonth(end.getMonth() + 6)
  else if (duration === '1y') end.setFullYear(end.getFullYear() + 1)
  else                         end.setFullYear(end.getFullYear() + 1)
  const rows = []
  const cur = new Date(start)
  while (cur <= end) {
    rows.push({ ...base, date: cur.toISOString().split('T')[0], recurrence_group_id: groupId })
    if (base.recurrence === 'weekly')       cur.setDate(cur.getDate() + 7)
    else if (base.recurrence === 'monthly') cur.setMonth(cur.getMonth() + 1)
    else                                    cur.setFullYear(cur.getFullYear() + 1)
  }
  return rows
}

function generateSplitOccurrences(
  base: { type: TransactionType; category: string; note: string | null },
  totalAmount: number,
  months: number,
  startDate: string,
  groupId: string,
) {
  const perMonth = Math.ceil((totalAmount / months) * 100) / 100
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(startDate + 'T00:00:00')
    d.setMonth(d.getMonth() + i)
    return { ...base, amount: perMonth, date: d.toISOString().split('T')[0], split_group_id: groupId }
  })
}

export default function TransactionModal({ open, transaction, onClose, onSaved }: Props) {
  const isEditing = transaction !== null
  const today = new Date().toISOString().split('T')[0]

  const [type, setType]             = useState<TransactionType>('expense')
  const [amount, setAmount]         = useState('')
  const [category, setCategory]     = useState('')
  const [date, setDate]             = useState(today)
  const [note, setNote]             = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence | null>(null)
  const [duration, setDuration]     = useState<Duration>('1y')
  const [isSplit, setIsSplit]           = useState(false)
  const [splitMonths, setSplitMonths]   = useState(3)
  const [isCustomSplit, setIsCustomSplit] = useState(false)
  const [customSplitInput, setCustomSplitInput] = useState('')

  const [categories, setCategories] = useState<Category[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (transaction) {
      setType(transaction.type)
      setAmount(String(transaction.amount))
      setCategory(transaction.category)
      setDate(transaction.date)
      setNote(transaction.note ?? '')
      setRecurrence(transaction.recurrence ?? null)
      setIsSplit(false)
      setDuration('1y')
      setSplitMonths(3)
      setIsCustomSplit(false)
      setCustomSplitInput('')
    } else {
      setType('expense')
      setAmount('')
      setCategory('')
      setDate(today)
      setNote('')
      setRecurrence(null)
      setIsSplit(false)
      setDuration('1y')
      setSplitMonths(3)
      setIsCustomSplit(false)
      setCustomSplitInput('')
    }
    setError(null)
  }, [open, transaction])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleTypeChange(t: TransactionType) {
    setType(t)
    setCategory('')
    if (t !== 'expense') { setIsSplit(false); setIsCustomSplit(false); setCustomSplitInput('') }
  }

  const filteredCategories = categories.filter((c) => c.type === type)

  const parsedAmount = parseFloat(amount)
  const validAmount  = !isNaN(parsedAmount) && parsedAmount > 0

  const occurrenceCount = recurrence && date
    ? computeOccurrenceCount(recurrence, date, duration)
    : null

  const resolvedMonths = isCustomSplit ? (parseInt(customSplitInput) || 0) : splitMonths
  const perMonth = isSplit && validAmount && resolvedMonths >= 1
    ? Math.ceil((parsedAmount / resolvedMonths) * 100) / 100
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validAmount)                         { setError('Amount must be greater than 0.'); return }
    if (!category)                            { setError('Please select a category.');      return }
    if (isSplit && resolvedMonths < 2)        { setError('Please enter at least 2 months.'); return }

    setSubmitting(true)
    const base = { type, category, note: note.trim() || null }

    if (isEditing) {
      const { error: dbError } = await supabase
        .from('transactions')
        .update({ ...base, amount: parsedAmount, date })
        .eq('id', transaction.id)
      setSubmitting(false)
      if (dbError) { setError(dbError.message); return }
    } else if (isSplit) {
      const rows = generateSplitOccurrences(base, parsedAmount, resolvedMonths, date, crypto.randomUUID())
      const { error: dbError } = await supabase.from('transactions').insert(rows)
      setSubmitting(false)
      if (dbError) { setError(dbError.message); return }
    } else if (recurrence) {
      const rows = generateRecurringOccurrences({ ...base, amount: parsedAmount, recurrence }, date, duration, crypto.randomUUID())
      const { error: dbError } = await supabase.from('transactions').insert(rows)
      setSubmitting(false)
      if (dbError) { setError(dbError.message); return }
    } else {
      const { error: dbError } = await supabase.from('transactions').insert({ ...base, amount: parsedAmount, date })
      setSubmitting(false)
      if (dbError) { setError(dbError.message); return }
    }

    onSaved()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl">

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Type */}
          <div>
            <label className={LABEL}>Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['expense', 'income', 'savings'] as TransactionType[]).map((t) => (
                <button key={t} type="button" onClick={() => handleTypeChange(t)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    type === t ? TYPE_ACTIVE[t] : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="tx-amount" className={LABEL}>
              {isSplit ? 'Total amount' : 'Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">$</span>
              <input
                id="tx-amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className={`${FIELD} pl-7`} required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="tx-category" className={LABEL}>Category</label>
            <select id="tx-category" value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD} required>
              <option value="" disabled>Select a category</option>
              {filteredCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="tx-date" className={LABEL}>
              {(recurrence || isSplit) && !isEditing ? 'Start date' : 'Date'}
            </label>
            <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} required />
          </div>

          {/* Recurring — new transactions only */}
          {!isEditing && (
            <div>
              <div className="flex items-center justify-between">
                <span className={LABEL} style={{ marginBottom: 0 }}>Recurring</span>
                <button
                  type="button" role="switch" aria-checked={Boolean(recurrence)}
                  onClick={() => { setRecurrence(recurrence ? null : 'monthly'); if (!recurrence) setIsSplit(false) }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${recurrence ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${recurrence ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {recurrence && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Frequency</p>
                    <div className="flex items-center gap-1.5">
                      {(['weekly', 'monthly', 'annual'] as Recurrence[]).map((r) => (
                        <button key={r} type="button" onClick={() => setRecurrence(r)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                            recurrence === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Duration</p>
                    <div className="flex items-center gap-1.5">
                      {(['3m', '6m', '1y'] as Duration[]).map((d) => (
                        <button key={d} type="button" onClick={() => setDuration(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            duration === d ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}>
                          {DURATION_LABELS[d]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {occurrenceCount !== null && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Creates {occurrenceCount} transaction{occurrenceCount !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Split expense — new expense transactions only */}
          {!isEditing && type === 'expense' && (
            <div>
              <div className="flex items-center justify-between">
                <span className={LABEL} style={{ marginBottom: 0 }}>Spread expense</span>
                <button
                  type="button" role="switch" aria-checked={isSplit}
                  onClick={() => { setIsSplit(!isSplit); if (!isSplit) setRecurrence(null) }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSplit ? 'bg-violet-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isSplit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {isSplit && (
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Spread over</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {SPLIT_MONTH_OPTIONS.map((m) => (
                        <button key={m} type="button"
                          onClick={() => { setSplitMonths(m); setIsCustomSplit(false); setCustomSplitInput('') }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            !isCustomSplit && splitMonths === m ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}>
                          {m}mo
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setIsCustomSplit(true); setCustomSplitInput('') }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isCustomSplit ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}>
                        Custom
                      </button>
                    </div>
                    {isCustomSplit && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="2"
                          max="60"
                          placeholder="e.g. 7"
                          value={customSplitInput}
                          onChange={(e) => setCustomSplitInput(e.target.value)}
                          className="w-24 text-sm border border-violet-300 dark:border-violet-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          autoFocus
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400">months</span>
                      </div>
                    )}
                  </div>
                  {perMonth !== null && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatCurrency(parsedAmount)} ÷ {resolvedMonths} months = {formatCurrency(perMonth)}/month
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info badges when editing */}
          {isEditing && transaction.recurrence && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
              <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span className="text-xs text-indigo-700 dark:text-indigo-300 capitalize">
                {transaction.recurrence} recurring — editing this occurrence only
              </span>
            </div>
          )}
          {isEditing && transaction.split_group_id && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900">
              <span className="text-violet-500 font-medium text-sm shrink-0">÷</span>
              <span className="text-xs text-violet-700 dark:text-violet-300">
                Spread expense — editing this installment only
              </span>
            </div>
          )}

          {/* Note */}
          <div>
            <label htmlFor="tx-note" className={LABEL}>
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea id="tx-note" rows={2} placeholder="Add a note…" value={note}
              onChange={(e) => setNote(e.target.value)} className={`${FIELD} resize-none`} />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {submitting ? 'Saving…'
                : isEditing ? 'Save Changes'
                : isSplit ? (resolvedMonths >= 2 ? `Spread over ${resolvedMonths} months` : 'Spread expense')
                : recurrence ? `Create Recurring (${occurrenceCount ?? '…'}×)`
                : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
