'use server';

import pool from './db';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Bank, Account, CreditCard, DigitalWallet, Income, Expense, SavingsGoal } from '@/types';
import { randomUUID } from 'crypto';

// Schemas
const bankSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
});

const accountSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  currency: z.enum(["ARS", "USD"], { required_error: "La moneda es requerida."}),
  cbu: z.string().optional(),
  alias: z.string().optional(),
});

const cardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  bank: z.string().min(2, "El banco es requerido."),
});

const walletSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
});

const incomeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser positivo."),
  date: z.date({ required_error: "La fecha es requerida." }),
  source: z.string({ required_error: "El origen es requerido." }),
});

const expenseSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.number().positive("El monto debe ser positivo."),
  date: z.date({ required_error: "La fecha es requerida." }),
  paymentMethod: z.string({ required_error: "El método de pago es requerido." }),
  bank: z.string().optional(),
  card: z.string().optional(),
  installments: z.number().min(1).optional(),
  isSaving: z.boolean().default(false),
});

// Bank Actions
export async function getBanks(): Promise<Bank[]> {
  const client = await pool.connect();
  try {
    const banksResult = await client.query('SELECT * FROM Banks ORDER BY Name');
    const accountsResult = await client.query('SELECT * FROM Accounts ORDER BY Name');
    
    const banks = banksResult.rows;
    const accounts = accountsResult.rows;

    return banks.map(bank => ({
      ...bank,
      id: bank.id.toString(), // Ensure id is a string
      accounts: accounts
        .filter(acc => acc.bankid === bank.id)
        .map(acc => ({...acc, id: acc.id.toString()})), // ensure account id is a string
    }));

  } finally {
    client.release();
  }
}

export async function saveBank(formData: FormData) {
  const id = formData.get('id') as string | null;
  const rawData = {
    name: formData.get('name'),
  };

  const validatedFields = bankSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const client = await pool.connect();
  try {
    if (id) {
      // Update
      await client.query('UPDATE Banks SET Name = $1 WHERE Id = $2', [validatedFields.data.name, id]);
    } else {
      // Create
      await client.query('INSERT INTO Banks (Id, Name, IsDeletable) VALUES ($1, $2, $3)', [randomUUID(), validatedFields.data.name, true]);
    }
    revalidatePath('/bancos');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to save bank.' };
  } finally {
    client.release();
  }
}

export async function deleteBank(id: string) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM Banks WHERE Id = $1 AND IsDeletable = TRUE', [id]);
        revalidatePath('/bancos');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to delete bank.' };
    } finally {
        client.release();
    }
}


// Account Actions
export async function saveAccount(formData: FormData) {
  const id = formData.get('id') as string | null;
  const bankId = formData.get('bankId') as string;
  const rawData = {
    name: formData.get('name'),
    currency: formData.get('currency'),
    cbu: formData.get('cbu'),
    alias: formData.get('alias'),
  };

  const validatedFields = accountSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const client = await pool.connect();
  try {
    if (id) {
      // Update
      await client.query(
        'UPDATE Accounts SET Name = $1, Currency = $2, Cbu = $3, Alias = $4 WHERE Id = $5 AND BankId = $6',
        [validatedFields.data.name, validatedFields.data.currency, validatedFields.data.cbu, validatedFields.data.alias, id, bankId]
      );
    } else {
      // Create
       await client.query(
        'INSERT INTO Accounts (Id, Name, Currency, Cbu, Alias, BankId) VALUES ($1, $2, $3, $4, $5, $6)',
        [randomUUID(), validatedFields.data.name, validatedFields.data.currency, validatedFields.data.cbu, validatedFields.data.alias, bankId]
      );
    }
    revalidatePath('/bancos');
    return { success: true };
  } catch(error) {
      console.error(error);
      return { message: 'Database Error: Failed to save account.' };
  }
  finally {
    client.release();
  }
}

export async function deleteAccount(id: string) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM Accounts WHERE Id = $1', [id]);
        revalidatePath('/bancos');
        return { success: true };
    } catch(error) {
        console.error(error);
        return { message: 'Database Error: Failed to delete account.' };
    } finally {
        client.release();
    }
}

// Card Actions
export async function getCards(): Promise<CreditCard[]> {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM CreditCards ORDER BY Name');
    return result.rows.map(c => ({...c, id: c.id.toString()}));
  } finally {
    client.release();
  }
}

export async function saveCard(data: z.infer<typeof cardSchema>) {
  const validatedFields = cardSchema.safeParse(data);
  if (!validatedFields.success) { return { errors: validatedFields.error.flatten().fieldErrors }; }
  
  const { id, name, bank } = validatedFields.data;
  const client = await pool.connect();
  try {
    if (id) {
      await client.query('UPDATE CreditCards SET Name = $1, Bank = $2 WHERE Id = $3', [name, bank, id]);
    } else {
      await client.query('INSERT INTO CreditCards (Id, Name, Bank) VALUES ($1, $2, $3)', [randomUUID(), name, bank]);
    }
    revalidatePath('/tarjetas');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to save card.' };
  } finally {
    client.release();
  }
}

export async function deleteCard(id: string) {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM CreditCards WHERE Id = $1', [id]);
    revalidatePath('/tarjetas');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { message: 'Database Error: Failed to delete card.' };
  } finally {
    client.release();
  }
}

// Wallet Actions
export async function getWallets(): Promise<DigitalWallet[]> {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM DigitalWallets ORDER BY Name');
        return result.rows.map(w => ({...w, id: w.id.toString()}));
    } finally {
        client.release();
    }
}

export async function saveWallet(data: z.infer<typeof walletSchema>) {
    const validatedFields = walletSchema.safeParse(data);
    if (!validatedFields.success) { return { errors: validatedFields.error.flatten().fieldErrors }; }

    const { id, name } = validatedFields.data;
    const client = await pool.connect();
    try {
        if (id) {
            await client.query('UPDATE DigitalWallets SET Name = $1 WHERE Id = $2', [name, id]);
        } else {
            await client.query('INSERT INTO DigitalWallets (Id, Name) VALUES ($1, $2)', [randomUUID(), name]);
        }
        revalidatePath('/billeteras');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to save wallet.' };
    } finally {
        client.release();
    }
}

export async function deleteWallet(id: string) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM DigitalWallets WHERE Id = $1', [id]);
        revalidatePath('/billeteras');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to delete wallet.' };
    } finally {
        client.release();
    }
}

// Income Actions
export async function getIncomes(): Promise<Income[]> {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM Incomes ORDER BY Date DESC');
        return result.rows.map(i => ({...i, id: i.id.toString(), amount: parseFloat(i.amount)}));
    } finally {
        client.release();
    }
}

export async function saveIncome(data: z.infer<typeof incomeSchema>) {
    const validatedFields = incomeSchema.safeParse(data);
    if (!validatedFields.success) { return { errors: validatedFields.error.flatten().fieldErrors }; }

    const { id, description, amount, date, source } = validatedFields.data;
    const client = await pool.connect();
    try {
        if (id) {
            await client.query('UPDATE Incomes SET Description = $1, Amount = $2, Date = $3, Source = $4 WHERE Id = $5', [description, amount, date, source, id]);
        } else {
            await client.query('INSERT INTO Incomes (Id, Description, Amount, Date, Source) VALUES ($1, $2, $3, $4, $5)', [randomUUID(), description, amount, date, source]);
        }
        revalidatePath('/ingresos');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to save income.' };
    } finally {
        client.release();
    }
}

export async function deleteIncome(id: string) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM Incomes WHERE Id = $1', [id]);
        revalidatePath('/ingresos');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to delete income.' };
    } finally {
        client.release();
    }
}

// Expense Actions
export async function getExpenses(): Promise<Expense[]> {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT * FROM Expenses ORDER BY Date DESC');
        return result.rows.map(e => ({...e, id: e.id.toString(), amount: parseFloat(e.amount)}));
    } finally {
        client.release();
    }
}

export async function saveExpense(data: z.infer<typeof expenseSchema>) {
    const validatedFields = expenseSchema.safeParse(data);
    if (!validatedFields.success) { return { errors: validatedFields.error.flatten().fieldErrors }; }
    
    const client = await pool.connect();
    try {
        const { id, description, amount, date, paymentMethod, bank, card, installments, isSaving } = validatedFields.data;
        if (id) {
            await client.query('UPDATE Expenses SET Description = $1, Amount = $2, Date = $3, PaymentMethod = $4, Bank = $5, Card = $6, Installments = $7, IsSaving = $8 WHERE Id = $9', [description, amount, date, paymentMethod, bank, card, installments, isSaving, id]);
        } else {
            await client.query('INSERT INTO Expenses (Id, Description, Amount, Date, PaymentMethod, Bank, Card, Installments, IsSaving) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [randomUUID(), description, amount, date, paymentMethod, bank, card, installments, isSaving]);
        }
        revalidatePath('/gastos');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to save expense.' };
    } finally {
        client.release();
    }
}

export async function deleteExpense(id: string) {
    const client = await pool.connect();
    try {
        await client.query('DELETE FROM Expenses WHERE Id = $1', [id]);
        revalidatePath('/gastos');
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to delete expense.' };
    } finally {
        client.release();
    }
}

// Savings Goal Actions
export async function getSavingsGoal(): Promise<number> {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT Percentage FROM SavingsGoals WHERE Id = $1', ['main']);
        if (result.rows.length > 0) {
            return result.rows[0].percentage;
        }
        return 20; // Default value
    } catch {
        return 20; // Default on error
    } finally {
        client.release();
    }
}

export async function saveSavingsGoal(percentage: number): Promise<{success: boolean, message?: string}> {
    const client = await pool.connect();
    try {
        await client.query('UPDATE SavingsGoals SET Percentage = $1 WHERE Id = $2', [percentage, 'main']);
        revalidatePath('/ahorros');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { message: 'Database Error: Failed to save savings goal.' };
    } finally {
        client.release();
    }
}

// Settings Actions
export async function checkDbConnection(): Promise<{ok: boolean}> {
    const client = await pool.connect();
    try {
        await client.query('SELECT NOW()');
        return { ok: true };
    } catch (error) {
        console.error("Database connection check failed:", error);
        return { ok: false };
    } finally {
        client.release();
    }
}
