import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/format'
import type { AccountType, InvestmentContribution, NetWorthAccount, NetWorthSnapshot } from '../../types'

// AccountTypeColor per design spec §2 — maps to CSS palette vars
const ACCOUNT_TYPE_META: Record<AccountType, { label: string; dot: string }> = {
  cash:       { label: 'Cash',       dot: 'var(--blue)'   },
  savings:    { label: 'Savings',    dot: 'var(--teal)'   },
  investment: { label: 'Investment', dot: 'var(--violet)' },
  retirement: { label: 'Retirement', dot: 'var(--amber)'  },
  debt:       { label: 'Debt',       dot: 'var(--red)'    },
}

interface AccountRow {
  account: NetWorthAccount
  latestSnapshot: NetWorthSnapshot | null
  contribution: InvestmentContribution | null
}

function daysSince(dateStr: string): number {
  const snap = new Date(dateStr + 'T00:00:00').getTime()
  const now  = new Date().setHours(0, 0, 0, 0)
  return Math.floor((now - snap) / 86_400_000)
}

function effectiveBalance(snapshot: NetWorthSnapshot | null, growthRate: number | null): number {
  if (!snapshot) return 0
  if (!growthRate || growthRate <= 0) return snapshot.balance
  const days = daysSince(snapshot.snapshot_date)
  return snapshot.balance * Math.pow(1 + growthRate, days / 365)
}

function stalenessLabel(days: number): string {
  if (days === 0) return 'logged today'
  if (days === 1) return 'logged yesterday'
  if (days < 30)  return `logged ${days}d ago`
  if (days < 365) return `logged ${Math.floor(days / 30)}mo ago`
  return `logged ${(days / 365).toFixed(1)}yr ago`
}

export default function NetWorthWidget() {
  const [rows, setRows]       = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [acctRes, snapRes, contribRes] = await Promise.all([
        supabase.from('net_worth_accounts').select('*').eq('active', true).eq('closed', false).order('sort_order', { ascending: true, nullsFirst: false }).order('created_at'),
        supabase.from('net_worth_snapshots').select('*').order('snapshot_date', { ascending: false }),
        supabase.from('investment_contributions').select('*').is('end_date', null).order('created_at'),
      ])

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

      setRows(accts.map(a => ({
        account:        a,
        latestSnapshot: latestSnap.get(a.id) ?? null,
        contribution:   latestContrib.get(a.id) ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const assetRows   = rows.filter(r => r.account.type !== 'debt')
  const liabRows    = rows.filter(r => r.account.type === 'debt')

  const totalAssets = assetRows.reduce((s, r) => s + effectiveBalance(r.latestSnapshot, r.account.growth_rate), 0)
  const totalLiab   = liabRows.reduce((s, r)  => s + effectiveBalance(r.latestSnapshot, r.account.growth_rate), 0)
  const netWorth    = totalAssets - totalLiab

  const anyEstimated = rows.some(r => r.account.growth_rate && r.latestSnapshot)

  const sortedDates = rows
    .map(r => r.latestSnapshot?.snapshot_date)
    .filter((d): d is string => Boolean(d))
    .sort()
  const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null

  const maxBalance = Math.max(...rows.map(r => effectiveBalance(r.latestSnapshot, r.account.growth_rate)), 1)

  if (loading) {
    return (
      <div className="rounded-[18px] border border-border bg-surface px-6 py-5 animate-pulse">
        <div className="h-3 w-20 rounded bg-surface-alt" />
        <div className="mt-3 h-8 w-36 rounded bg-surface-alt" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-surface-alt" />)}
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-[18px] border border-dashed border-border bg-surface px-6 py-8 text-center">
        <p className="text-sm text-ink-muted">No net worth accounts set up yet.</p>
        <Link
          to="/settings/net-worth"
          className="mt-2 inline-block text-xs font-medium text-terra hover:opacity-70 transition-opacity"
        >
          Configure accounts in Settings →
        </Link>
      </div>
    )
  }

  const hasSnapshots = rows.some(r => r.latestSnapshot !== null)

  return (
    <div className="rounded-[18px] border border-border bg-surface shadow-card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">

        {/* Left: summary */}
        <div
          className="px-7 py-7 border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-between"
          style={{ background: 'linear-gradient(180deg, var(--terra-soft) 0%, transparent 80%)' }}
        >
          <div>
            <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">Net Worth</p>
            {hasSnapshots ? (
              <>
                <p className={`mt-2 text-[44px] font-semibold num leading-[1.05] tracking-[-0.03em] ${netWorth >= 0 ? 'text-ink' : 'text-red'}`}>
                  {netWorth >= 0 ? '' : '−'}{formatCurrency(Math.abs(netWorth))}
                </p>
                <p className="mt-1 text-[12.5px] text-ink-faint">
                  {anyEstimated ? 'estimated as of today' : latestDate ? `as of ${formatDate(latestDate)}` : ''}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-faint">No balances logged yet.</p>
            )}

            {hasSnapshots && (
              <div className="mt-7 pt-[18px] border-t border-border flex flex-col gap-2.5">
                <div className="flex justify-between items-baseline text-[13.5px]">
                  <span className="text-ink-muted">Assets</span>
                  <span className="font-medium text-forest num">{formatCurrency(totalAssets)}</span>
                </div>
                {totalLiab > 0 && (
                  <div className="flex justify-between items-baseline text-[13.5px]">
                    <span className="text-ink-muted">Liabilities</span>
                    <span className="font-medium text-red num">−{formatCurrency(totalLiab)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Link
            to="/settings/net-worth"
            className="mt-7 text-[13px] font-medium text-terra hover:opacity-70 transition-opacity self-start"
          >
            Manage accounts →
          </Link>
        </div>

        {/* Right: per-account breakdown */}
        <div className="px-7 py-6">
          <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow mb-4">Breakdown</p>
          <div className="space-y-[14px]">
            {assetRows.map(({ account, latestSnapshot, contribution }) => (
              <AccountBar
                key={account.id}
                account={account}
                snapshot={latestSnapshot}
                contribution={contribution}
                maxBalance={maxBalance}
                isLiability={false}
              />
            ))}
            {liabRows.map(({ account, latestSnapshot, contribution }) => (
              <AccountBar
                key={account.id}
                account={account}
                snapshot={latestSnapshot}
                contribution={contribution}
                maxBalance={maxBalance}
                isLiability={true}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function AccountBar({
  account, snapshot, contribution, maxBalance, isLiability,
}: {
  account: NetWorthAccount
  snapshot: NetWorthSnapshot | null
  contribution: InvestmentContribution | null
  maxBalance: number
  isLiability: boolean
}) {
  const meta       = ACCOUNT_TYPE_META[account.type]
  const isEst      = Boolean(account.growth_rate && snapshot)
  const balance    = effectiveBalance(snapshot, account.growth_rate)
  const pct        = maxBalance > 0 ? (balance / maxBalance) * 100 : 0
  const days       = snapshot ? daysSince(snapshot.snapshot_date) : null
  const isPaidOff  = isLiability && snapshot !== null && snapshot.balance === 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
          <span className="text-[13.5px] font-medium text-ink truncate">{account.name}</span>
          {isPaidOff && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-forest shrink-0"
              style={{ background: 'var(--forest-soft)' }}
            >
              Paid off ✓
            </span>
          )}
          {contribution && (
            <span className="text-[10px] text-ink-faint shrink-0">
              +{formatCurrency(contribution.amount)}/{contribution.frequency === 'annual' ? 'yr' : contribution.frequency === 'weekly' ? 'wk' : 'mo'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {isEst && !isPaidOff && (
            <span className="text-[10px] font-medium text-ink-muted bg-surface-alt px-1.5 py-0.5 rounded">
              est.
            </span>
          )}
          <span className={`text-[13.5px] font-medium num ${
            isPaidOff   ? 'text-forest' :
            isLiability ? 'text-red'    : 'text-ink'
          }`}>
            {snapshot ? (isLiability && !isPaidOff ? '−' : '') + formatCurrency(balance) : '—'}
          </span>
        </div>
      </div>
      {snapshot && !isPaidOff && (
        <>
          <div className="h-1 rounded-full bg-surface-alt overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: meta.dot, opacity: isLiability ? 0.5 : 0.75 }}
            />
          </div>
          {isEst && days !== null && days > 0 && (
            <p className="mt-0.5 text-[10px] text-ink-faint">
              {stalenessLabel(days)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
