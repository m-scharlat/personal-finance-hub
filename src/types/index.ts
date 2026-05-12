export type TransactionType   = 'expense' | 'income' | 'savings'
export type TransactionStatus = 'auto' | 'confirmed'
export type Recurrence        = 'weekly' | 'monthly' | 'annual'
export type AccountType       = 'cash' | 'savings' | 'investment' | 'retirement' | 'debt'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  date: string
  note: string | null
  created_at: string
  year: number
  month: number
  recurrence: Recurrence | null
  recurrence_group_id: string | null
  split_group_id: string | null
  status: TransactionStatus | null
}

export interface Category {
  id: string
  type: TransactionType
  name: string
  sort_order: number
  created_at: string
}

export interface ImportMapping {
  id: string
  triggers: string[]
  category: string
  type: TransactionType
  created_at: string
}

export interface MonthlyTrendPoint {
  label: string
  year: number
  month: number
  income: number
  expenses: number
  savings: number
  savingsRate: number
}

export interface NetWorthAccount {
  id: string
  name: string
  type: AccountType
  subtype: string | null
  sort_order: number | null
  active: boolean
  closed: boolean
  growth_rate: number | null
  created_at: string
}

export interface NetWorthSnapshot {
  id: string
  account_id: string
  balance: number
  snapshot_date: string
  notes: string | null
  created_at: string
}

export interface InvestmentContribution {
  id: string
  account_id: string
  amount: number
  frequency: Recurrence
  start_date: string
  end_date: string | null
  created_at: string
}
