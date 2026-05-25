import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import SettingsNav from '../../components/SettingsNav'
import type { Category, ImportMapping, TransactionType } from '../../types'

const TYPES: TransactionType[] = ['expense', 'income', 'savings']
const TYPE_LABELS: Record<TransactionType, string> = {
  expense: 'Expense', income: 'Income', savings: 'Savings',
}
const TYPE_COLORS: Record<TransactionType, string> = {
  expense: 'bg-red-soft text-red',
  income:  'bg-forest-soft text-forest',
  savings: 'bg-terra-soft text-terra',
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

// ── TagInput ──────────────────────────────────────────────────────────────

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagInput({ tags, onChange, placeholder }: TagInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed || tags.includes(trimmed)) { setValue(''); return }
    onChange([...tags, trimmed])
    setValue('')
  }

  function removeTag(i: number) {
    onChange(tags.filter((_, idx) => idx !== i))
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-[10px] border border-border bg-surface min-h-[40px] cursor-text focus-within:ring-2 focus-within:ring-terra focus-within:border-transparent"
    >
      {tags.map((tag, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface-alt text-ink border border-border">
          {tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeTag(i) }}
            className="text-ink-faint hover:text-ink leading-none"
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(value) }
          if (e.key === 'Backspace' && !value && tags.length > 0) removeTag(tags.length - 1)
        }}
        onBlur={() => { if (value.trim()) addTag(value) }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-24 text-sm outline-none bg-transparent text-ink placeholder:text-ink-faint"
      />
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ImportMappings() {
  const [mappings, setMappings]     = useState<ImportMapping[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [triggers, setTriggers]   = useState<string[]>([])
  const [formType, setFormType]   = useState<TransactionType>('expense')
  const [formCat, setFormCat]     = useState('')
  const [saving, setSaving]       = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const [{ data: maps }, { data: cats }] = await Promise.all([
      supabase.from('import_mappings').select('*').order('created_at'),
      supabase.from('categories').select('*').order('type').order('name'),
    ])
    setMappings(maps ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }

  const catsForType = categories.filter((c) => c.type === formType)

  useEffect(() => {
    const available = categories.filter((c) => c.type === formType)
    if (available.length > 0 && !available.find((c) => c.name === formCat)) {
      setFormCat(available[0].name)
    }
  }, [formType, categories])

  async function handleAdd() {
    if (triggers.length === 0) { setFormError('Add at least one trigger phrase.'); return }
    if (!formCat) { setFormError('Select a category.'); return }
    setSaving(true)
    setFormError(null)
    const { error: err } = await supabase.from('import_mappings').insert({
      triggers,
      category: formCat,
      type: formType,
    })
    setSaving(false)
    if (err) { setFormError(err.message); return }
    setTriggers([])
    await fetchAll()
  }

  async function handleDelete(id: string) {
    const { error: err } = await supabase.from('import_mappings').delete().eq('id', id)
    if (err) { setError(err.message); return }
    setDeletingId(null)
    await fetchAll()
  }

  return (
    <div className="px-9 py-8">
      <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Settings</h1>
      <SettingsNav />

      {error && (
        <div className="mb-4 rounded-[10px] border border-border bg-red-soft px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      {/* Add mapping */}
      <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Add Mapping</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            When any trigger phrase exactly matches an import note (case-insensitive), it will be auto-categorized.
          </p>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">
              Trigger phrases <span className="font-normal text-ink-faint">(press Enter or comma to add each)</span>
            </label>
            <TagInput
              tags={triggers}
              onChange={setTriggers}
              placeholder="e.g. netflix, NFLX, Netflix Inc"
            />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as TransactionType)}
                className="text-sm pl-3 pr-8 py-2 rounded-[10px] border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra appearance-none"
              >
                {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Category</label>
              <select
                value={formCat}
                onChange={(e) => setFormCat(e.target.value)}
                className="w-full text-sm pl-3 pr-8 py-2 rounded-[10px] border border-border bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-terra appearance-none"
              >
                {catsForType.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving || triggers.length === 0}
              className="px-4 py-2 text-sm font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity whitespace-nowrap"
            >
              {saving ? 'Saving…' : 'Save mapping'}
            </button>
          </div>
          {formError && (
            <p className="text-xs text-red">{formError}</p>
          )}
        </div>
      </div>

      {/* Saved mappings list */}
      <div className="mt-4 rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-ink">Saved Mappings</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm text-ink-faint">Loading…</div>
        ) : mappings.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-faint">
            No mappings yet. Add one above or confirm uncertain rows during import.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {mappings.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3 min-h-[52px]">
                {deletingId === m.id ? (
                  <>
                    <span className="flex-1 text-sm text-ink-muted">
                      Delete this mapping?
                    </span>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="text-xs font-medium text-red hover:opacity-70 transition-opacity"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="text-xs font-medium text-ink-faint hover:text-ink-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 flex flex-wrap items-center gap-1.5">
                      {m.triggers.map((t) => (
                        <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium bg-surface-alt text-ink border border-border">
                          {t}
                        </span>
                      ))}
                      <span className="text-xs text-ink-faint mx-0.5">→</span>
                      <span className="text-xs font-medium text-ink">{m.category}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[6px] text-[10px] font-medium ${TYPE_COLORS[m.type]}`}>
                        {TYPE_LABELS[m.type]}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeletingId(m.id)}
                      className="p-1 text-ink-faint hover:text-red transition-colors"
                      aria-label="Delete mapping"
                    >
                      <TrashIcon />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
