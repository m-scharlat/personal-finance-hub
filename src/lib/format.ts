export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Returns clean tick values and a domain for a Y-axis starting at 0.
 * Snaps to round intervals (1/2/5 × magnitude) so ticks are always user-friendly.
 */
export function niceYAxis(maxVal: number, targetTicks = 5): { ticks: number[]; domain: [number, number] } {
  if (maxVal <= 0) return { ticks: [0], domain: [0, 1] }
  const rawInterval = maxVal / targetTicks
  const magnitude   = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  const normalized  = rawInterval / magnitude
  const multiplier  = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const interval    = multiplier * magnitude
  // Always one full interval above maxVal so the data never touches the top edge
  const topTick     = (Math.floor(maxVal / interval) + 1) * interval
  const ticks: number[] = []
  for (let v = 0; v <= topTick; v += interval) {
    ticks.push(Math.round(v))
  }
  return { ticks, domain: [0, topTick] }
}

export function formatYTick(v: number): string {
  if (v >= 1000) {
    const k = v / 1000
    return `$${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return `$${v}`
}

export function formatDate(dateStr: string): string {
  // Append time so the date is parsed as local, not UTC midnight
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}
