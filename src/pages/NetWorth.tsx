import NetWorthWidget from '../components/dashboard/NetWorthWidget'
import NetWorthChart from '../components/dashboard/NetWorthChart'

export default function NetWorth() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Net Worth</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your overall financial position at a glance.</p>
      </div>
      <NetWorthWidget />
      <div className="mt-6">
        <NetWorthChart />
      </div>
    </div>
  )
}
