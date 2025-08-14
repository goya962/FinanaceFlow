export interface Account {
  id: string;
  name: string;
  currency: 'ARS' | 'USD';
  cbu?: string;
  alias?: string;
  bankid?: string; // Foreign key
}

export interface Bank {
  id: string;
  name: string;
  accounts: Account[];
  isdeletable?: boolean; // Matches postgres column name
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
  bank?: string;
  card?: string;
  installments?: number;
  isSaving?: boolean;
}

export interface Income {
  id: string;
  description: string;
  amount: number;
  date: Date;
  source: string;
}

export interface SavingsGoal {
  id: 'main'; // Singleton document
  percentage: number;
}
