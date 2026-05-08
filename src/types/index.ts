export type TransactionType = 'expense' | 'income' | 'savings'

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
}

export interface Category {
  id: string
  type: TransactionType
  name: string
  sort_order: number
  created_at: string
}
