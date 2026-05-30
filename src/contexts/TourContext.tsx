import { createContext, useContext, useState } from 'react'

export interface TourStep {
  route:        string | null
  targetId:     string | null
  title:        string
  description:  string
  tip?:         string
  tipLink?:     string
  tipLinkLabel?: string
  preview?:     'dashboard'
  ctaA?:        { label: string; route: string }
}

export const TOUR_STEPS: TourStep[] = [
  {
    route:       null,
    targetId:    null,
    title:       'Welcome to Cairn',
    description: 'A quick tour of the three things that will give you clarity on your financial picture (~1 min).',
  },
  {
    route:       '/settings/net-worth',
    targetId:    'tour-add-account',
    title:       'Net Worth',
    description: 'Start here. Add your bank accounts, investments, retirement funds, and debts. Cairn tracks your net worth over time — the single most important number for your financial health.',
  },
  {
    route:       '/tracker',
    targetId:    'tour-add-transaction',
    title:       'Transactions',
    description: 'Log any income, expense, or savings transaction here — one at a time, past or present. This is your core habit. The data you add here powers everything else.',
    tip:         'You\'ll need spending categories before you start.',
    tipLink:     '/settings/categories',
    tipLinkLabel: 'Set up categories →',
  },
  {
    route:       '/import',
    targetId:    'tour-import-input',
    title:       'Bulk Import',
    description: 'Already have past data in a notes app? Paste it here to load a whole month at once instead of adding entries one by one. Use − for expenses, + for income, = for savings.',
  },
  {
    route:       '/dashboard',
    targetId:    null,
    title:       'Dashboard',
    description: 'Once you have transactions, your dashboard shows exactly where your money goes — by category, over time, and against your budget.',
    preview:     'dashboard',
  },
  {
    route:    null,
    targetId: null,
    title:    "You're all set",
    description: 'Start by adding your accounts, then log a few transactions. Your financial picture builds from there.',
    ctaA:     { label: 'Add my first account', route: '/settings/net-worth' },
  },
]

const STORAGE_KEY = 'cairn_tour_complete'

interface TourContextValue {
  active:      boolean
  step:        number
  totalSteps:  number
  advance:     () => void
  back:        () => void
  complete:    () => void
  skip:        () => void
  restart:     () => void
}

const TourContext = createContext<TourContextValue>({
  active:     false,
  step:       0,
  totalSteps: TOUR_STEPS.length,
  advance:    () => {},
  back:       () => {},
  complete:   () => {},
  skip:       () => {},
  restart:    () => {},
})

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(() => !localStorage.getItem(STORAGE_KEY))
  const [step,   setStep]   = useState(0)

  function advance() { setStep(s => Math.min(s + 1, TOUR_STEPS.length - 1)) }
  function back()    { setStep(s => Math.max(s - 1, 0)) }

  function complete() { localStorage.setItem(STORAGE_KEY, 'true'); setActive(false) }
  function skip()     { localStorage.setItem(STORAGE_KEY, 'true'); setActive(false) }
  function restart()  { localStorage.removeItem(STORAGE_KEY); setStep(0); setActive(true) }

  return (
    <TourContext.Provider value={{ active, step, totalSteps: TOUR_STEPS.length, advance, back, complete, skip, restart }}>
      {children}
    </TourContext.Provider>
  )
}

export const useTour = () => useContext(TourContext)

export function useTourHighlight(id: string): boolean {
  const { active, step } = useTour()
  return active && TOUR_STEPS[step]?.targetId === id
}
