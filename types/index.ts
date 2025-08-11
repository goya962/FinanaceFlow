
export interface Account {
  id: string;
  name: string;
  currency: 'ARS' | 'USD';
  cbu?: string;
  alias?: string;
}

export interface Bank {
  id: string;
  name: string;
  accounts: Account[];
  isDeletable?: boolean;
}

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
}

export interface DigitalWallet {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: 'Débito' | 'Crédito' | 'Efectivo' | 'Transferencia' | string;
  bank?: string; // This will now refer to an Account's name/id
  card?: string;
  installments?: number;
  isSaving?: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
  source: string; // This will now refer to an Account's name/id
}

export interface SavingsGoal {
  id: 'main'; // Singleton document
  percentage: number;
}

export interface MonthStatus {
  id: string; // e.g., "2024-07"
  year: number;
  month: number;
  status: 'open' | 'locked' | 'closed';
}
