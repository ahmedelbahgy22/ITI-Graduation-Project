export type ExpenseCategory = 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Other';

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Other'
] as const;

export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  date: string; // ISO format string (YYYY-MM-DD)
  note: string;
}

export type SortField = 'date' | 'amount';
export type SortOrder = 'asc' | 'desc';
export type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
