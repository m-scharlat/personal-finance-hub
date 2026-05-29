import InfoTooltip from '../InfoTooltip'

interface Props {
  label: string
  value: string
  subLabel?: string
  info?: string         // tooltip text shown on the (i) icon next to the label
  color?: 'forest' | 'red' | 'terra' | 'amber' | 'teal' | 'ink'
  delta?: string        // pre-formatted change, e.g. "↑ 12.3%" or "↓ $240"
  deltaGood?: boolean   // true = forest, false = red
  deltaLabel?: string   // e.g. "vs 2024" or "vs Mar '24"
}

const VALUE_COLOR: Record<NonNullable<Props['color']>, string> = {
  forest: 'text-forest',
  red:    'text-red',
  terra:  'text-terra',
  amber:  'text-amber',
  teal:   'text-teal',
  ink:    'text-ink',
}

export default function MetricCard({ label, value, subLabel, info, color = 'ink', delta, deltaGood, deltaLabel }: Props) {
  return (
    <div className="bg-surface border border-border rounded-[18px] shadow-card p-[18px]">
      <div className="flex items-center gap-1.5">
        <p className="text-[11px] font-medium text-ink-muted uppercase tracking-eyebrow">{label}</p>
        {info && <InfoTooltip text={info} />}
      </div>
      <p className={`mt-2 text-[26px] font-semibold leading-none tracking-[-0.02em] num ${VALUE_COLOR[color]}`}>
        {value}
      </p>
      {subLabel && (
        <p className="mt-1 text-[12px] text-ink-faint">{subLabel}</p>
      )}
      {delta && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`text-[12px] font-medium num ${
            deltaGood === true  ? 'text-forest' :
            deltaGood === false ? 'text-red' :
                                  'text-ink-faint'
          }`}>
            {delta}
          </span>
          {deltaLabel && (
            <span className="text-[12px] text-ink-faint">{deltaLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}
