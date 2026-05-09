export type TransactionType = 'expense' | 'income' | 'savings'
export type Recurrence = 'weekly' | 'monthly' | 'annual'

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
