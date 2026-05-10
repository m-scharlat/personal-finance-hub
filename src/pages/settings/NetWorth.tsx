import { useEffect, useRef, useState } from 'react'
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

const ACCOUNT_TYPES: AccountType[] = ['cash', 'savings', 'investment', 'retirement', 'debt']
const SCHEDULE_TYPES: AccountType[] = ['investment', 'retirement']
const FREQ_LABELS: Record<Recurrence, string> = { weekly: 'Weekly', monthly: 'Monthly', annual: 'Annual' }

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
  | { kind: 'schedule'; account: NetWorthAccount; existing: InvestmentContribution | null }
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

  const [accounts, setAccounts] = useState<AccountWithMeta[]>([])
  const [loading, setLoading]   = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [modal, setModal]       = useState<Modal | null>(null)
  const [saving, setSaving]     = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  // Account form
  const [acctName, setAcctName] = useState('')
  const [acctType, setAcctType] = useState<AccountType>('cash')
  const acctNameRef = useRef<HTMLInputElement>(null)

  // Snapshot form
  const [snapBalance, setSnapBalance] = useState('')
  const [snapDate, setSnapDate]       = useState(today)
  const [snapNotes, setSnapNotes]     = useState('')
  const snapBalanceRef = useRef<HTMLInputElement>(null)

  // Contribution schedule form
  const [schedAmt, setSchedAmt]   = useState('')
  const [schedFreq, setSchedFreq] = useState<Recurrence>('monthly')
  const [schedStart, setSchedStart] = useState(today)
  const schedAmtRef = useRef<HTMLInputElement>(null)

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => { load() }, [])

  // Focus first input when modal opens
  useEffect(() => {
    if (!modal) return
    if (modal.kind === 'account')  setTimeout(() => acctNameRef.current?.focus(), 50)
    if (modal.kind === 'snapshot') setTimeout(() => snapBalanceRef.current?.focus(), 50)
    if (modal.kind === 'schedule') setTimeout(() => schedAmtRef.current?.focus(), 50)
  }, [modal])

  async function load() {
    setLoading(true)
    setPageError(null)

    const [acctRes, snapRes, contribRes] = await Promise.all([
      supabase.from('net_worth_accounts').select('*').eq('active', true).order('created_at'),
      supabase.from('net_worth_snapshots').select('*').order('snapshot_date', { ascending: false }),
      supabase.from('investment_contributions').select('*').is('end_date', null).order('created_at'),
    ])

    if (acctRes.error) { setPageError(acctRes.error.message); setLoading(false); return }

    const accts      = (acctRes.data ?? []) as NetWorthAccount[]
    const snaps      = (snapRes.data ?? []) as NetWorthSnapshot[]
    const contribs   = (contribRes.data ?? []) as InvestmentContribution[]

    const latestSnap  = new Map<string, NetWorthSnapshot>()
    for (const s of snaps) {
      if (!latestSnap.has(s.account_id)) latestSnap.set(s.account_id, s)
    }

    const latestContrib = new Map<string, InvestmentContribution>()
    for (const c of contribs) {
      if (!latestContrib.has(c.account_id)) latestContrib.set(c.account_id, c)
    }

    setAccounts(accts.map(a => ({
      account:        a,
      latestSnapshot: latestSnap.get(a.id) ?? null,
      contribution:   latestContrib.get(a.id) ?? null,
    })))
    setLoading(false)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────

  function openAddAccount() {
    setAcctName(''); setAcctType('cash'); setModalError(null)
    setModal({ kind: 'account', target: null })
  }

  function openEditAccount(a: NetWorthAccount) {
    setAcctName(a.name); setAcctType(a.type); setModalError(null)
    setModal({ kind: 'account', target: a })
  }

  function openSnapshot(a: NetWorthAccount, existing: NetWorthSnapshot | null) {
    setSnapBalance(existing ? String(existing.balance) : '')
    setSnapDate(existing ? existing.snapshot_date : today)
    setSnapNotes(existing?.notes ?? '')
    setModalError(null)
    setModal({ kind: 'snapshot', account: a })
  }

  function openSchedule(a: NetWorthAccount, existing: InvestmentContribution | null) {
    setSchedAmt(existing ? String(existing.amount) : '')
    setSchedFreq(existing?.frequency ?? 'monthly')
    setSchedStart(existing?.start_date ?? today)
    setModalError(null)
    setModal({ kind: 'schedule', account: a, existing })
  }

  function closeModal() { setModal(null); setModalError(null) }

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function saveAccount() {
    const name = acctName.trim()
    if (!name) return
    if (modal?.kind !== 'account') return
    setSaving(true); setModalError(null)

    const isEdit = modal.target !== null
    const { error } = isEdit
      ? await supabase.from('net_worth_accounts').update({ name, type: acctType }).eq('id', modal.target!.id)
      : await supabase.from('net_worth_accounts').insert({ name, type: acctType })

    setSaving(false)
    if (error) { setModalError(error.message); return }
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

  async function saveSchedule() {
    if (modal?.kind !== 'schedule') return
    const amount = parseFloat(schedAmt)
    if (isNaN(amount) || amount <= 0) { setModalError('Enter a valid amount.'); return }
    setSaving(true); setModalError(null)

    // End any existing active schedule before inserting the new one
    if (modal.existing) {
      await supabase.from('investment_contributions')
        .update({ end_date: today })
        .eq('id', modal.existing.id)
    }

    const { error } = await supabase.from('investment_contributions').insert({
      account_id: modal.account.id,
      amount,
      frequency:  schedFreq,
      start_date: schedStart,
    })

    setSaving(false)
    if (error) { setModalError(error.message); return }
    closeModal(); await load()
  }

  async function removeSchedule() {
    if (modal?.kind !== 'schedule' || !modal.existing) return
    setSaving(true)
    await supabase.from('investment_contributions')
      .update({ end_date: today })
      .eq('id', modal.existing.id)
    setSaving(false)
    closeModal(); await load()
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from('net_worth_accounts').update({ active: false }).eq('id', id)
    if (error) { setPageError(error.message); return }
    setModal(null); await load()
  }

  // ── Grouping ──────────────────────────────────────────────────────────────

  const assets      = accounts.filter(a => a.account.type !== 'debt')
  const liabilities = accounts.filter(a => a.account.type === 'debt')

  // ── Render ─────────────────────────────────────────────────────────────────

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
          {/* Assets */}
          {assets.length > 0 && (
            <AccountGroup
              title="Assets"
              items={assets}
              onEdit={openEditAccount}
              onLogBalance={(a, snap) => openSnapshot(a, snap)}
              onSchedule={(a, c) => openSchedule(a, c)}
              onDelete={(a) => setModal({ kind: 'delete', account: a })}
            />
          )}
          {/* Liabilities */}
          {liabilities.length > 0 && (
            <AccountGroup
              title="Liabilities"
              items={liabilities}
              onEdit={openEditAccount}
              onLogBalance={(a, snap) => openSnapshot(a, snap)}
              onSchedule={null}
              onDelete={(a) => setModal({ kind: 'delete', account: a })}
            />
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {modal?.kind === 'account' && (
        <ModalShell
          title={modal.target ? 'Edit Account' : 'Add Account'}
          onClose={closeModal}
        >
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
          <div>
            <label className={LABEL}>Account type</label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map(t => {
                const meta = ACCOUNT_TYPE_META[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAcctType(t)}
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

      {modal?.kind === 'schedule' && (
        <ModalShell title={`Contribution Schedule — ${modal.account.name}`} onClose={closeModal}>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            Recurring contributions help track committed spend against this account.
          </p>
          <div>
            <label className={LABEL}>Amount per contribution</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
              <input
                ref={schedAmtRef}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={schedAmt}
                onChange={e => setSchedAmt(e.target.value)}
                className={FIELD + ' pl-6'}
              />
            </div>
          </div>
          <div>
            <label className={LABEL}>Frequency</label>
            <div className="flex gap-2">
              {(['weekly', 'monthly', 'annual'] as Recurrence[]).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSchedFreq(f)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    schedFreq === f
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  {FREQ_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL}>Starting from</label>
            <input
              type="date"
              value={schedStart}
              onChange={e => setSchedStart(e.target.value)}
              className={FIELD}
            />
          </div>
          {modalError && <p className="text-xs text-red-600 dark:text-red-400">{modalError}</p>}
          <div className="flex items-center justify-between pt-1">
            {modal.existing ? (
              <button
                onClick={removeSchedule}
                disabled={saving}
                className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-40"
              >
                Remove schedule
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                Cancel
              </button>
              <button
                onClick={saveSchedule}
                disabled={saving || !schedAmt}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving…' : 'Save Schedule'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {modal?.kind === 'delete' && (
        <ModalShell title="Delete Account?" onClose={closeModal}>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Removing <strong>{modal.account.name}</strong> will hide it from your net worth.
            Historical snapshots are preserved.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              Cancel
            </button>
            <button
              onClick={() => deleteAccount(modal.account.id)}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
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
  onSchedule: ((a: NetWorthAccount, c: InvestmentContribution | null) => void) | null
  onDelete: (a: NetWorthAccount) => void
}

function AccountGroup({ title, items, onEdit, onLogBalance, onSchedule, onDelete }: GroupProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</p>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
        {items.map(({ account, latestSnapshot, contribution }) => {
          const meta = ACCOUNT_TYPE_META[account.type]
          const showSchedule = onSchedule !== null && SCHEDULE_TYPES.includes(account.type)
          return (
            <div key={account.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                {/* Left: name + meta */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: meta.dot }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{account.name}</span>
                      <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    {latestSnapshot ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatCurrency(latestSnapshot.balance)}
                        <span className="ml-1 text-gray-400 dark:text-gray-500">
                          as of {formatDate(latestSnapshot.snapshot_date)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">No balance logged yet</p>
                    )}
                    {contribution && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {formatCurrency(contribution.amount)}/{contribution.frequency === 'annual' ? 'yr' : contribution.frequency === 'weekly' ? 'wk' : 'mo'} contribution
                      </p>
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
                  {showSchedule && (
                    <button
                      onClick={() => onSchedule!(account, contribution)}
                      title="Contribution schedule"
                      className={`p-1.5 rounded-md border transition-colors ${
                        contribution
                          ? 'border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                          : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </button>
                  )}
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
        })}
      </div>
    </div>
  )
}
