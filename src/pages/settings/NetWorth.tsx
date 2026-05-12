import { useEffect, useRef, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/format'
import SettingsNav from '../../components/SettingsNav'
import type { AccountType, InvestmentContribution, NetWorthAccount, NetWorthSnapshot, Recurrence } from '../../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; badgeClass: string; dot: string }> = {
  cash:       { label: 'Cash',       dot: '#3b82f6', badgeClass: 'bg-blue-50   dark:bg-blue-950   text-blue-700   dark:text-blue-300'   },
  savings:    { label: 'Savings',    dot: '#10b981', badgeClass: 'bg-green-50  dark:bg-green-950  text-green-700  dark:text-green-300'  },
  investment: { label: 'Investment', dot: '#6366f1', badgeClass: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300' },
  retirement: { label: 'Retirement', dot: '#f59e0b', badgeClass: 'bg-amber-50  dark:bg-amber-950  text-amber-700  dark:text-amber-300'  },
  debt:       { label: 'Debt',       dot: '#ef4444', badgeClass: 'bg-red-50    dark:bg-red-950    text-red-700    dark:text-red-300'    },
}

const ACCOUNT_TYPES: AccountType[]    = ['cash', 'savings', 'investment', 'retirement', 'debt']
const SCHEDULE_TYPES: AccountType[]   = ['savings', 'investment', 'retirement']
const GROWTH_RATE_TYPES: AccountType[] = ['savings', 'investment', 'retirement']
const LIABILITY_SUBTYPES = ['Credit Card', 'Student Loan', 'Auto Loan', 'Mortgage', 'Personal Loan', 'Line of Credit']

const FIELD = [
  'w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2',
  'bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
].join(' ')

const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountWithMeta {
  account: NetWorthAccount
  latestSnapshot: NetWorthSnapshot | null
  contribution: InvestmentContribution | null
}

type Modal =
  | { kind: 'account'; target: NetWorthAccount | null }
  | { kind: 'snapshot'; account: NetWorthAccount }
  | { kind: 'delete'; account: NetWorthAccount }

// ── Icons ─────────────────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
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

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XIcon />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NetWorthSettings() {
  const d = new Date()
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [accounts, setAccounts]           = useState<AccountWithMeta[]>([])
  const [closedAccounts, setClosedAccounts] = useState<AccountWithMeta[]>([])
  const [loading, setLoading]             = useState(true)
  const [pageError, setPageError]   = useState<string | null>(null)
  const [modal, setModal]           = useState<Modal | null>(null)
  const [saving, setSaving]         = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Account form
  const [acctName, setAcctName]             = useState('')
  const [acctType, setAcctType]             = useState<AccountType>('cash')
  const [acctSubtype, setAcctSubtype]       = useState<string | null>(null)
  const [acctGrowthRate, setAcctGrowthRate] = useState('')
  const acctNameRef = useRef<HTMLInputElement>(null)

  // Snapshot form
  const [snapBalance, setSnapBalance] = useState('')
  const [snapDate, setSnapDate]       = useState(today)
  const [snapNotes, setSnapNotes]     = useState('')
  const snapBalanceRef = useRef<HTMLInputElement>(null)

  // Contribution schedule (embedded in account form)
  const [schedAmt, setSchedAmt]   = useState('')
  const [schedFreq, setSchedFreq] = useState<Recurrence>('monthly')

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!modal) return
    if (modal.kind === 'account')  setTimeout(() => acctNameRef.current?.focus(), 50)
    if (modal.kind === 'snapshot') setTimeout(() => snapBalanceRef.current?.focus(), 50)
  }, [modal])

  async function load() {
    setLoading(true)
    setPageError(null)

    const [acctRes, snapRes, contribRes] = await Promise.all([
      supabase.from('net_worth_accounts').select('*').eq('active', true).order('sort_order', { ascending: true, nullsFirst: false }).order('created_at'),
      supabase.from('net_worth_snapshots').select('*').order('snapshot_date', { ascending: false }),
      supabase.from('investment_contributions').select('*').is('end_date', null).order('created_at'),
    ])

    if (acctRes.error) { setPageError(acctRes.error.message); setLoading(false); return }

    const accts    = (acctRes.data ?? []) as NetWorthAccount[]
    const snaps    = (snapRes.data ?? []) as NetWorthSnapshot[]
    const contribs = (contribRes.data ?? []) as InvestmentContribution[]

    const latestSnap = new Map<string, NetWorthSnapshot>()
    for (const s of snaps) {
      if (!latestSnap.has(s.account_id)) latestSnap.set(s.account_id, s)
    }

    const latestContrib = new Map<string, InvestmentContribution>()
    for (const c of contribs) {
      if (!latestContrib.has(c.account_id)) latestContrib.set(c.account_id, c)
    }

    const toMeta = (a: NetWorthAccount) => ({
      account:        a,
      latestSnapshot: latestSnap.get(a.id) ?? null,
      contribution:   latestContrib.get(a.id) ?? null,
    })

    setAccounts(accts.filter(a => !a.closed).map(toMeta))
    setClosedAccounts(accts.filter(a => a.closed).map(toMeta))
    setLoading(false)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openAddAccount() {
    setAcctName(''); setAcctType('cash'); setAcctSubtype(null); setAcctGrowthRate('')
    setSchedAmt(''); setSchedFreq('monthly'); setModalError(null)
    setModal({ kind: 'account', target: null })
  }

  function openEditAccount(a: NetWorthAccount) {
    const existing = accounts.find(r => r.account.id === a.id)?.contribution ?? null
    setAcctName(a.name)
    setAcctType(a.type)
    setAcctSubtype(a.subtype ?? null)
    setAcctGrowthRate(a.growth_rate != null ? String(parseFloat((a.growth_rate * 100).toFixed(4))) : '')
    setSchedAmt(existing ? String(existing.amount) : '')
    setSchedFreq(existing?.frequency ?? 'monthly')
    setModalError(null)
    setModal({ kind: 'account', target: a })
  }

  function openSnapshot(a: NetWorthAccount, existing: NetWorthSnapshot | null) {
    setSnapBalance(existing ? String(existing.balance) : '')
    setSnapDate(existing ? existing.snapshot_date : today)
    setSnapNotes(existing?.notes ?? '')
    setModalError(null)
    setModal({ kind: 'snapshot', account: a })
  }

  function closeModal() { setModal(null); setModalError(null) }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function saveAccount() {
    const name = acctName.trim()
    if (!name) return
    if (modal?.kind !== 'account') return
    setSaving(true); setModalError(null)

    const supportsGrowthRate = GROWTH_RATE_TYPES.includes(acctType)
    const parsedRate = parseFloat(acctGrowthRate)
    const growth_rate = supportsGrowthRate && !isNaN(parsedRate) && parsedRate > 0
      ? parsedRate / 100
      : null

    const subtype = acctType === 'debt' ? acctSubtype : null

    const isEdit = modal.target !== null
    let accountId: string

    if (isEdit) {
      const { error } = await supabase.from('net_worth_accounts')
        .update({ name, type: acctType, growth_rate, subtype })
        .eq('id', modal.target!.id)
      if (error) { setSaving(false); setModalError(error.message); return }
      accountId = modal.target!.id
    } else {
      const { data, error } = await supabase.from('net_worth_accounts')
        .insert({ name, type: acctType, growth_rate, subtype })
        .select()
        .single()
      if (error) { setSaving(false); setModalError(error.message); return }
      accountId = (data as NetWorthAccount).id
    }

    // Handle contribution schedule for supported account types
    if (SCHEDULE_TYPES.includes(acctType)) {
      const existingContrib = accounts.find(r => r.account.id === accountId)?.contribution ?? null
      const amount = parseFloat(schedAmt)

      if (!isNaN(amount) && amount > 0) {
        const scheduleChanged = !existingContrib ||
          existingContrib.amount !== amount ||
          existingContrib.frequency !== schedFreq

        if (scheduleChanged) {
          if (existingContrib) {
            await supabase.from('investment_contributions')
              .update({ end_date: today })
              .eq('id', existingContrib.id)
          }
          await supabase.from('investment_contributions').insert({
            account_id: accountId,
            amount,
            frequency:  schedFreq,
            start_date: today,
          })
        }
      } else if (existingContrib) {
        await supabase.from('investment_contributions')
          .update({ end_date: today })
          .eq('id', existingContrib.id)
      }
    }

    setSaving(false)
    closeModal(); await load()
  }

  async function saveSnapshot() {
    if (modal?.kind !== 'snapshot') return
    const balance = parseFloat(snapBalance)
    if (isNaN(balance)) { setModalError('Enter a valid balance.'); return }
    setSaving(true); setModalError(null)

    const { error } = await supabase.from('net_worth_snapshots').insert({
      account_id:    modal.account.id,
      balance,
      snapshot_date: snapDate,
      notes:         snapNotes.trim() || null,
    })

    setSaving(false)
    if (error) { setModalError(error.message); return }
    closeModal(); await load()
  }

  async function closeAccount(id: string) {
    const { error } = await supabase.from('net_worth_accounts').update({ closed: true }).eq('id', id)
    if (error) { setPageError(error.message); return }
    setModal(null); await load()
  }

  async function reopenAccount(id: string) {
    const { error } = await supabase.from('net_worth_accounts').update({ closed: false }).eq('id', id)
    if (error) { setPageError(error.message); return }
    await load()
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from('net_worth_accounts').update({ active: false }).eq('id', id)
    if (error) { setPageError(error.message); return }
    setModal(null); await load()
  }

  async function handleReorder(reordered: AccountWithMeta[]) {
    // Update state immediately for a responsive feel
    const ids = new Set(reordered.map(r => r.account.id))
    setAccounts([...accounts.filter(r => !ids.has(r.account.id)), ...reordered])
    // Persist sort_order for the reordered group
    await Promise.all(reordered.map((item, index) =>
      supabase.from('net_worth_accounts').update({ sort_order: index }).eq('id', item.account.id)
    ))
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  const assets      = accounts.filter(a => a.account.type !== 'debt')
  const liabilities = accounts.filter(a => a.account.type === 'debt')

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
      <SettingsNav />

      {pageError && (
        <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {pageError}
        </div>
      )}

      {/* Header row */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Accounts</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track assets and liabilities that make up your net worth.
          </p>
        </div>
        <button
          onClick={openAddAccount}
          className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          + Add Account
        </button>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <div className="h-4 w-32 rounded bg-gray-100 dark:bg-gray-800" />
              <div className="mt-2 h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No accounts yet.</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Add checking accounts, investments, retirement funds, and debts.
          </p>
          <button
            onClick={openAddAccount}
            className="mt-4 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add your first account
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {assets.length > 0 && (
            <AccountGroup
              title="Assets"
              items={assets}
              onEdit={openEditAccount}
              onLogBalance={(a, snap) => openSnapshot(a, snap)}
              onDelete={(a) => setModal({ kind: 'delete', account: a })}
              onReorder={handleReorder}
            />
          )}
          {liabilities.length > 0 && (
            <AccountGroup
              title="Liabilities"
              items={liabilities}
              onEdit={openEditAccount}
              onLogBalance={(a, snap) => openSnapshot(a, snap)}
              onDelete={(a) => setModal({ kind: 'delete', account: a })}
              onReorder={handleReorder}
            />
          )}
          {closedAccounts.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Closed</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                {closedAccounts.map(({ account, latestSnapshot }) => {
                  const meta = ACCOUNT_TYPE_META[account.type]
                  return (
                    <div key={account.id} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 opacity-40" style={{ backgroundColor: meta.dot }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-400 dark:text-gray-500 truncate">{account.name}</span>
                            <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full opacity-50 ${meta.badgeClass}`}>
                              {account.type === 'debt' && account.subtype ? account.subtype : meta.label}
                            </span>
                          </div>
                          {latestSnapshot && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {formatCurrency(latestSnapshot.balance)} · closed {formatDate(latestSnapshot.snapshot_date)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => reopenAccount(account.id)}
                        className="px-2.5 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-md hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shrink-0"
                      >
                        Reopen
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {modal?.kind === 'account' && (
        <ModalShell
          title={modal.target ? 'Edit Account' : 'Add Account'}
          onClose={closeModal}
        >
          {/* Name */}
          <div>
            <label className={LABEL}>Account name</label>
            <input
              ref={acctNameRef}
              type="text"
              placeholder="e.g. Chase Checking, Vanguard Roth IRA"
              value={acctName}
              onChange={e => setAcctName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveAccount()}
              className={FIELD}
            />
          </div>

          {/* Type */}
          <div>
            <label className={LABEL}>Account type</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(t => {
                const meta = ACCOUNT_TYPE_META[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setAcctType(t); if (t !== 'debt') setAcctSubtype(null) }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors text-left ${
                      acctType === t
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Liability subtype */}
          {acctType === 'debt' && (
            <div>
              <label className={LABEL}>
                Liability type <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {LIABILITY_SUBTYPES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setAcctSubtype(acctSubtype === s ? null : s)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      acctSubtype === s
                        ? 'border-red-400 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring contribution */}
          {SCHEDULE_TYPES.includes(acctType) && (
            <div>
              <label className={LABEL}>
                Recurring contribution <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={schedAmt}
                  onChange={e => setSchedAmt(e.target.value)}
                  className={FIELD + ' pl-6'}
                />
              </div>
              <div className="flex gap-2 mt-2">
                {(['weekly', 'monthly', 'annual'] as Recurrence[]).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSchedFreq(f)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      schedFreq === f
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {f === 'weekly' ? 'Weekly' : f === 'monthly' ? 'Monthly' : 'Annual'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Annual rate */}
          {GROWTH_RATE_TYPES.includes(acctType) && (
            <div>
              <label className={LABEL}>
                Annual rate <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 7"
                  value={acctGrowthRate}
                  onChange={e => setAcctGrowthRate(e.target.value)}
                  className={FIELD + ' pr-8'}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                The expected yearly return or interest rate for this account.
              </p>
            </div>
          )}

          {modalError && <p className="text-xs text-red-600 dark:text-red-400">{modalError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </button>
            <button
              onClick={saveAccount}
              disabled={saving || !acctName.trim()}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : modal.target ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </ModalShell>
      )}

      {modal?.kind === 'snapshot' && (
        <ModalShell title={`Log Balance — ${modal.account.name}`} onClose={closeModal}>
          <div>
            <label className={LABEL}>Balance</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                ref={snapBalanceRef}
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={snapBalance}
                onChange={e => setSnapBalance(e.target.value)}
                className={FIELD + ' pl-6'}
              />
            </div>
            {modal.account.type === 'debt' && (
              <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                Enter the outstanding balance (positive number).
              </p>
            )}
          </div>
          <div>
            <label className={LABEL}>As of date</label>
            <input
              type="date"
              value={snapDate}
              onChange={e => setSnapDate(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label className={LABEL}>Notes <span className="font-normal text-gray-400">(optional)</span></label>
            <input
              type="text"
              placeholder="e.g. After year-end statement"
              value={snapNotes}
              onChange={e => setSnapNotes(e.target.value)}
              className={FIELD}
            />
          </div>
          {modalError && <p className="text-xs text-red-600 dark:text-red-400">{modalError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </button>
            <button
              onClick={saveSnapshot}
              disabled={saving || !snapBalance}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving…' : 'Log Balance'}
            </button>
          </div>
        </ModalShell>
      )}

      {modal?.kind === 'delete' && (
        <ModalShell title="Remove Account?" onClose={closeModal}>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            How would you like to remove <strong>{modal.account.name}</strong>?
          </p>
          <div className="space-y-2">
            <button
              onClick={() => closeAccount(modal.account.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white">Close account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Hides from your active net worth. Balance history is preserved.
              </p>
            </button>
            <button
              onClick={() => deleteAccount(modal.account.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-red-100 dark:border-red-900/30 hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete account</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Removes entirely. Use for accounts added by mistake.
              </p>
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

// ── Account group ─────────────────────────────────────────────────────────────

interface GroupProps {
  title: string
  items: AccountWithMeta[]
  onEdit: (a: NetWorthAccount) => void
  onLogBalance: (a: NetWorthAccount, snap: NetWorthSnapshot | null) => void
  onDelete: (a: NetWorthAccount) => void
  onReorder: (reordered: AccountWithMeta[]) => void
}

function GripIcon() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="2"  r="1.5" /><circle cx="8" cy="2"  r="1.5" />
      <circle cx="2" cy="7"  r="1.5" /><circle cx="8" cy="7"  r="1.5" />
      <circle cx="2" cy="12" r="1.5" /><circle cx="8" cy="12" r="1.5" />
    </svg>
  )
}

function SortableAccountRow({
  item, onEdit, onLogBalance, onDelete,
}: {
  item: AccountWithMeta
  onEdit: (a: NetWorthAccount) => void
  onLogBalance: (a: NetWorthAccount, snap: NetWorthSnapshot | null) => void
  onDelete: (a: NetWorthAccount) => void
}) {
  const { account, latestSnapshot } = item
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id })

  const meta      = ACCOUNT_TYPE_META[account.type]
  const isPaidOff = account.type === 'debt' && latestSnapshot !== null && latestSnapshot.balance === 0

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="px-5 py-4 bg-white dark:bg-gray-900"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Drag handle + left content */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            tabIndex={-1}
            className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none shrink-0"
          >
            <GripIcon />
          </button>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{account.name}</span>
              <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.badgeClass}`}>
                {account.type === 'debt' && account.subtype ? account.subtype : meta.label}
              </span>
            </div>
            {latestSnapshot ? (
              isPaidOff ? (
                <>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                    Paid off ✓
                    <span className="ml-1 text-gray-400 dark:text-gray-500">
                      · {formatDate(latestSnapshot.snapshot_date)}
                    </span>
                  </p>
                  <button
                    onClick={() => onDelete(account)}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors mt-0.5"
                  >
                    Close account →
                  </button>
                </>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {formatCurrency(latestSnapshot.balance)}
                  <span className="ml-1 text-gray-400 dark:text-gray-500">
                    as of {formatDate(latestSnapshot.snapshot_date)}
                  </span>
                </p>
              )
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No balance logged yet</p>
            )}
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onLogBalance(account, latestSnapshot)}
            className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
          >
            Log Balance
          </button>
          <button
            onClick={() => onEdit(account)}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Edit"
          >
            <PencilIcon />
          </button>
          <button
            onClick={() => onDelete(account)}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}

function AccountGroup({ title, items, onEdit, onLogBalance, onDelete, onReorder }: GroupProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(r => r.account.id === active.id)
    const newIndex = items.findIndex(r => r.account.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) onReorder(arrayMove(items, oldIndex, newIndex))
  }

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(r => r.account.id)} strategy={verticalListSortingStrategy}>
            {items.map(item => (
              <SortableAccountRow
                key={item.account.id}
                item={item}
                onEdit={onEdit}
                onLogBalance={onLogBalance}
                onDelete={onDelete}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  )
}
