import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatDate } from '../../lib/format'
import type { AccountType, InvestmentContribution, NetWorthAccount, NetWorthSnapshot } from '../../types'

const ACCOUNT_TYPE_META: Record<AccountType, { label: string; dot: string }> = {
  cash:       { label: 'Cash',       dot: '#3b82f6' },
  savings:    { label: 'Savings',    dot: '#10b981' },
  investment: { label: 'Investment', dot: '#6366f1' },
  retirement: { label: 'Retirement', dot: '#f59e0b' },
  debt:       { label: 'Debt',       dot: '#ef4444' },
}

interface AccountRow {
  account: NetWorthAccount
  latestSnapshot: NetWorthSnapshot | null
  contribution: InvestmentContribution | null
}

export default function NetWorthWidget() {
  const [rows, setRows]       = useState<AccountRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [acctRes, snapRes, contribRes] = await Promise.all([
        supabase.from('net_worth_accounts').select('*').eq('active', true).order('created_at'),
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

  const assetRows     = rows.filter(r => r.account.type !== 'debt')
  const liabRows      = rows.filter(r => r.account.type === 'debt')
  const totalAssets   = assetRows.reduce((s, r) => s + (r.latestSnapshot?.balance ?? 0), 0)
  const totalLiab     = liabRows.reduce((s, r) => s + (r.latestSnapshot?.balance ?? 0), 0)
  const netWorth      = totalAssets - totalLiab

  // Most recent snapshot date across all accounts (for "as of" display)
  const sortedDates = rows
    .map(r => r.latestSnapshot?.snapshot_date)
    .filter((d): d is string => Boolean(d))
    .sort()
  const latestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : null

  // Max balance for sizing the relative bars
  const maxBalance = Math.max(...rows.map(r => r.latestSnapshot?.balance ?? 0), 1)

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 animate-pulse">
        <div className="h-3 w-20 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-3 h-8 w-36 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mt-4 space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-4 rounded bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-8 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No net worth accounts set up yet.</p>
        <Link
          to="/settings/net-worth"
          className="mt-2 inline-block text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Configure accounts in Settings →
        </Link>
      </div>
    )
  }

  const hasSnapshots = rows.some(r => r.latestSnapshot !== null)

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">

        {/* Left: summary */}
        <div className="px-6 py-5 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Net Worth</p>
            {hasSnapshots ? (
              <>
                <p className={`mt-2 text-3xl font-semibold tabular-nums ${netWorth >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                  {netWorth >= 0 ? '' : '−'}{formatCurrency(Math.abs(netWorth))}
                </p>
                {latestDate && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    as of {formatDate(latestDate)}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No balances logged yet.</p>
            )}
          </div>

          {hasSnapshots && (
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Assets</span>
                <span className="font-medium text-green-600 dark:text-green-400 tabular-nums">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              {totalLiab > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Liabilities</span>
                  <span className="font-medium text-red-500 dark:text-red-400 tabular-nums">
                    −{formatCurrency(totalLiab)}
                  </span>
                </div>
              )}
            </div>
          )}

          <Link
            to="/settings/net-worth"
            className="mt-4 text-xs text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            Manage accounts →
          </Link>
        </div>

        {/* Right: per-account breakdown */}
        <div className="px-6 py-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">Breakdown</p>
          <div className="space-y-3">
            {/* Assets */}
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
            {/* Liabilities */}
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
  const meta    = ACCOUNT_TYPE_META[account.type]
  const balance = snapshot?.balance ?? 0
  const pct     = maxBalance > 0 ? (balance / maxBalance) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
          <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{account.name}</span>
          {contribution && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
              +{formatCurrency(contribution.amount)}/{contribution.frequency === 'annual' ? 'yr' : contribution.frequency === 'weekly' ? 'wk' : 'mo'}
            </span>
          )}
        </div>
        <span className={`text-sm font-medium tabular-nums shrink-0 ml-3 ${
          isLiability ? 'text-red-500 dark:text-red-400' : 'text-gray-900 dark:text-white'
        }`}>
          {snapshot ? (isLiability ? '−' : '') + formatCurrency(balance) : '—'}
        </span>
      </div>
      {snapshot && (
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: meta.dot, opacity: isLiability ? 0.5 : 0.75 }}
          />
        </div>
      )}
    </div>
  )
}
