import NetWorthWidget from '../components/dashboard/NetWorthWidget'
import NetWorthChart from '../components/dashboard/NetWorthChart'

export default function NetWorth() {
  return (
    <div className="px-9 py-8">
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold text-ink tracking-[-0.02em]">Net Worth</h1>
        <p className="mt-1 text-sm text-ink-muted">A snapshot of your financial health.</p>
      </div>
      <NetWorthWidget />
      <div className="mt-4">
        <NetWorthChart />
      </div>
    </div>
  )
}
