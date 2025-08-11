
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, PiggyBank, ArrowRight, Wallet } from "lucide-react";
import { format, getMonth, getYear, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { es } from "date-fns/locale";
import type { Expense, Income } from "@/types";

const mockExpenses: Expense[] = [
    { id: '1', description: 'Supermercado', amount: 150, date: new Date(), paymentMethod: 'Débito', bank: 'Brubank' },
    { id: '2', description: 'Cuota Gimnasio', amount: 50, date: new Date(), paymentMethod: 'Crédito', card: 'Visa', installments: 1 },
];
const mockIncomes: Income[] = [
    { id: '1', description: 'Salario', amount: 2500, date: new Date(), source: 'Ciudad' },
    { id: '2', description: 'Venta online', amount: 200, date: new Date(), source: 'Mercado Pago' },
];

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const storedExpenses = localStorage.getItem("expenses");
    const storedIncomes = localStorage.getItem("incomes");

    const expensesWithDates: Expense[] = storedExpenses
      ? JSON.parse(storedExpenses).map((e: Expense) => ({ ...e, date: new Date(e.date) }))
      : mockExpenses.map(e => ({...e, date: new Date(e.date)}));
      
    const incomesWithDates: Income[] = storedIncomes
      ? JSON.parse(storedIncomes).map((i: Income) => ({ ...i, date: new Date(i.date) }))
      : mockIncomes.map(i => ({...i, date: new Date(i.date)}));

    setExpenses(expensesWithDates);
    setIncomes(incomesWithDates);
  }, []);

  const handleMonthChange = (monthValue: string) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(monthValue, 10));
    setSelectedDate(newDate);
  };

  const handleYearChange = (yearValue: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(yearValue, 10));
    setSelectedDate(newDate);
  };

  const start = startOfMonth(selectedDate);
  const end = endOfMonth(selectedDate);

  const filteredIncomes = incomes.filter(
    (income) => income.date >= start && income.date <= end
  );
  
  const regularExpenses = expenses.filter(
    (expense) => expense.date >= start && expense.date <= end && !expense.isSaving
  );

  const savingsExpenses = expenses.filter(
    (expense) => expense.date >= start && expense.date <= end && expense.isSaving
  );

  const totalIncome = filteredIncomes.reduce((acc, income) => acc + income.amount, 0);
  const totalRegularExpenses = regularExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  const monthlySavingsContribution = savingsExpenses.reduce((acc, expense) => acc + expense.amount, 0);
  
  const balance = totalIncome - totalRegularExpenses;
  
  // Calculate cumulative savings
  const allTimeSavingsContributions = expenses
    .filter(e => e.isSaving)
    .reduce((acc, e) => acc + e.amount, 0);
  const allTimeSavingsWithdrawals = expenses
    .filter(e => e.bank === 'Ahorros')
    .reduce((acc, e) => acc + e.amount, 0);
  const cumulativeSavings = allTimeSavingsContributions - allTimeSavingsWithdrawals;

  
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(new Date(0, i), "LLLL", { locale: es }),
  }));
  
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // Annual data calculation
  const annualStart = startOfYear(selectedDate);
  const annualEnd = endOfYear(selectedDate);
  const yearIncomes = incomes.filter(i => i.date >= annualStart && i.date <= annualEnd);
  const yearExpenses = expenses.filter(e => e.date >= annualStart && e.date <= annualEnd && !e.isSaving);
  const yearSavings = expenses.filter(e => e.date >= annualStart && e.date <= annualEnd && e.isSaving);

  const annualData = months.map((month, index) => {
    const monthlyIncomes = yearIncomes.filter(i => getMonth(i.date) === index).reduce((acc, i) => acc + i.amount, 0);
    const monthlyExpenses = yearExpenses.filter(e => getMonth(e.date) === index).reduce((acc, e) => acc + e.amount, 0);
    const monthlySavings = yearSavings.filter(e => getMonth(e.date) === index).reduce((acc, e) => acc + e.amount, 0);
    return {
      name: month.label.substring(0,3),
      ingresos: monthlyIncomes,
      gastos: monthlyExpenses,
      ahorros: monthlySavings,
    }
  });


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Resumen Mensual</h1>
        <div className="flex gap-2">
          <Select value={getMonth(selectedDate).toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Mes" /></SelectTrigger>
            <SelectContent>
              {months.map((month) => (<SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={getYear(selectedDate).toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Año" /></SelectTrigger>
            <SelectContent>
              {years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-destructive">${totalRegularExpenses.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Balance del Mes</CardTitle>
            <PiggyBank className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-destructive'}`}>${balance.toFixed(2)}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ahorros Acumulados</CardTitle>
            <Wallet className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-primary`}>${cumulativeSavings.toFixed(2)}</div>
             <p className="text-xs text-muted-foreground">
                +${monthlySavingsContribution.toFixed(2)} este mes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Detalle de Ingresos</CardTitle>
              <CardDescription>Todos los ingresos registrados para el mes seleccionado.</CardDescription>
            </div>
             <Link href={`/ingresos?year=${getYear(selectedDate)}&month=${getMonth(selectedDate)}`} passHref>
                <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredIncomes.slice(0, 5).length > 0 ? (
                  filteredIncomes.slice(0, 5).map((income) => (
                    <TableRow key={income.id}><TableCell className="font-medium">{income.description}</TableCell><TableCell>{format(new Date(income.date), "dd/MM/yy")}</TableCell><TableCell className="text-right">${income.amount.toFixed(2)}</TableCell></TableRow>
                  ))
                ) : (<TableRow><TableCell colSpan={3} className="text-center">No hay ingresos este mes.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
                <CardTitle>Detalle de Gastos</CardTitle>
                <CardDescription>Todos los gastos registrados para el mes seleccionado.</CardDescription>
            </div>
            <Link href={`/gastos?year=${getYear(selectedDate)}&month=${getMonth(selectedDate)}`} passHref>
                <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </Link>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Fecha</TableHead><TableHead className="text-right">Monto</TableHead></TableRow></TableHeader>
              <TableBody>
                {expenses.filter(e => e.date >= start && e.date <= end).slice(0, 5).length > 0 ? (
                  expenses.filter(e => e.date >= start && e.date <= end).slice(0, 5).map((expense) => (
                    <TableRow key={expense.id} className={expense.isSaving ? "bg-blue-100/50 dark:bg-blue-900/20" : ""}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>{format(new Date(expense.date), "dd/MM/yy")}</TableCell>
                        <TableCell className="text-right">${expense.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                 ) : (<TableRow><TableCell colSpan={3} className="text-center">No hay gastos este mes.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Resumen Anual ({getYear(selectedDate)})</CardTitle>
          <CardDescription>Comparativa de ingresos, gastos y ahorros mensuales para el año seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={annualData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "var(--radius)",
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "12px"}}/>
                        <Bar dataKey="ingresos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Ingresos"/>
                        <Bar dataKey="gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Gastos"/>
                        <Bar dataKey="ahorros" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Ahorros"/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
