import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTour, TOUR_STEPS } from '../contexts/TourContext'

function CairnMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="12" y="36" width="40" height="14" rx="7" fill="var(--terra)" />
      <rect x="18" y="20" width="28" height="14" rx="7" fill="var(--forest)" />
      <rect x="24" y="4"  width="16" height="14" rx="7" fill="var(--amber)" />
    </svg>
  )
}

function DashboardPreview() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium bg-forest-soft text-forest">
        <span className="w-1.5 h-1.5 rounded-full bg-forest shrink-0" />
        Income $4,200
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium bg-red-soft text-red">
        <span className="w-1.5 h-1.5 rounded-full bg-red shrink-0" />
        Expenses $2,800
      </span>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-xs font-medium bg-teal-soft text-teal">
        <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />
        Saved $1,400
      </span>
    </div>
  )
}

export default function TourCard() {
  const { active, step, advance, back, complete, skip } = useTour()
  const navigate = useNavigate()
  const current  = TOUR_STEPS[step]

  const isWelcome    = step === 0
  const isDone       = step === TOUR_STEPS.length - 1
  const isLastFeature = step === TOUR_STEPS.length - 2
  const featureCount = TOUR_STEPS.length - 2
  const featureStep  = step - 1

  useEffect(() => {
    if (active && current.route) navigate(current.route)
  }, [step, active])

  if (!active) return null

  function handleNext() { advance() }
  function handleBack() { back() }
  function handleCtaA() { if (current.ctaA) navigate(current.ctaA.route); complete() }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] bg-surface border border-border rounded-[18px] shadow-card overflow-hidden">

      {/* Top bar */}
      <div className="px-5 pt-5 flex items-center justify-between">
        {isWelcome && <CairnMark />}

        {!isWelcome && !isDone && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: featureCount }).map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === featureStep ? 16 : 8,
                  background: i <= featureStep ? 'var(--terra)' : 'var(--border)',
                  opacity: i < featureStep ? 0.45 : 1,
                }}
              />
            ))}
          </div>
        )}

        {isDone && <div />}

        <button
          onClick={skip}
          className="ml-auto p-1 -mr-1 text-ink-faint hover:text-ink transition-colors"
          aria-label="Dismiss tour"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 3l10 10M13 3L3 13" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pt-3 pb-5">
        <h3 className={`font-semibold text-ink tracking-[-0.01em] ${isWelcome ? 'text-[17px] mt-1' : 'text-[14px]'}`}>
          {current.title}
        </h3>
        <p className="mt-1.5 text-[13px] text-ink-muted leading-relaxed">
          {current.description}
        </p>

        {current.preview === 'dashboard' && <DashboardPreview />}

        {current.tip && (
          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-[10px] bg-surface-alt border border-border">
            <svg className="shrink-0 mt-px" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="7" />
              <line x1="8" y1="7" x2="8" y2="11" />
              <circle cx="8" cy="4.5" r="0.75" fill="currentColor" stroke="none" />
            </svg>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              {current.tip}{' '}
              {current.tipLink && (
                <a
                  href={current.tipLink}
                  onClick={e => { e.preventDefault(); navigate(current.tipLink!) }}
                  className="text-terra font-medium hover:opacity-70 transition-opacity"
                >
                  {current.tipLinkLabel}
                </a>
              )}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-4 ${isDone ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-3'}`}>
          {isDone && (
            <>
              <button
                onClick={handleCtaA}
                className="w-full px-4 py-2.5 text-[13px] font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 transition-opacity"
              >
                {current.ctaA?.label}
              </button>
              <button
                onClick={complete}
                className="w-full py-1.5 text-[13px] text-ink-muted hover:text-ink transition-colors text-center"
              >
                I'll explore on my own
              </button>
            </>
          )}

          {isWelcome && (
            <>
              <button
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 text-[13px] font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 transition-opacity"
              >
                Start tour
              </button>
              <button
                onClick={skip}
                className="text-[13px] text-ink-muted hover:text-ink transition-colors"
              >
                Skip
              </button>
            </>
          )}

          {!isWelcome && !isDone && (
            <>
              <button
                onClick={handleBack}
                className="text-[13px] text-ink-muted hover:text-ink transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 text-[13px] font-medium bg-terra text-white rounded-[10px] shadow-terra hover:opacity-90 transition-opacity"
              >
                {isLastFeature ? 'Finish' : 'Next →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
