

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, PlusCircle, Edit, Trash2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import type { Expense, Bank, CreditCard as CardType } from "@/types";

const expenseSchema = z.object({
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive("El monto debe ser positivo.")),
  date: z.date({ required_error: "La fecha es requerida." }),
  paymentMethod: z.string({ required_error: "El método de pago es requerido." }),
  bank: z.string().optional(),
  card: z.string().optional(),
  installments: z.preprocess((a) => parseInt(z.string().parse(a) || "1", 10), z.number().min(1).optional()),
  isSaving: z.boolean().default(false),
});

const mockExpenses: Expense[] = [
    { id: '1', description: 'Supermercado', amount: 150, date: new Date(), paymentMethod: 'Débito', bank: 'Brubank' },
    { id: '2', description: 'Cuota Gimnasio', amount: 50, date: new Date(), paymentMethod: 'Crédito', card: 'Visa', installments: 1 },
];

function GastosPageComponent() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const { toast } = useToast();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [selectedDate, setSelectedDate] = useState(() => {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    if (year && month) {
      return new Date(parseInt(year), parseInt(month));
    }
    return new Date();
  });

  useEffect(() => {
    // In a real app, this would be fetched from a central store/context
    const storedExpenses = localStorage.getItem("expenses");
     const expensesWithDates: Expense[] = storedExpenses
      ? JSON.parse(storedExpenses).map((e: Expense) => ({ ...e, date: new Date(e.date) }))
      : mockExpenses.map(e => ({...e, date: new Date(e.date)}));
    setExpenses(expensesWithDates);
    
    const storedBanks = localStorage.getItem("banks");
    const storedCards = localStorage.getItem("cards");
    
    const initialBanks: Bank[] = [ { id: "0", name: "Ahorros", isDeletable: false }, { id: "1", name: "Ciudad" }, { id: "2", name: "Brubank" }, { id: "3", name: "ICBC" }];
    const initialCards: CardType[] = [ { id: "1", name: "Visa", bank: "Ciudad" }, { id: "2", name: "Mastercard", bank: "ICBC" }];

    setBanks(storedBanks ? JSON.parse(storedBanks) : initialBanks);
    setCards(storedCards ? JSON.parse(storedCards) : initialCards);
  }, []);

  useEffect(() => {
    const year = getYear(selectedDate);
    const month = getMonth(selectedDate);

    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return getYear(expenseDate) === year && getMonth(expenseDate) === month;
    });
    setFilteredExpenses(filtered);

    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    params.set('month', month.toString());
    router.replace(`${pathname}?${params.toString()}`);

  }, [selectedDate, expenses, pathname, router, searchParams]);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { isSaving: false, installments: 1 },
  });
  
  const paymentMethod = form.watch("paymentMethod");

  useEffect(() => {
    if (editingExpense) {
      form.reset({
        ...editingExpense,
        amount: editingExpense.amount,
        date: new Date(editingExpense.date),
        installments: editingExpense.installments || 1,
      });
    } else {
      form.reset({
        description: "",
        amount: 0,
        date: new Date(),
        paymentMethod: undefined,
        bank: undefined,
        card: undefined,
        installments: 1,
        isSaving: false,
      });
    }
  }, [editingExpense, form]);


  function onSubmit(values: z.infer<typeof expenseSchema>) {
    if (editingExpense) {
        const updatedExpenses = expenses.map(e => e.id === editingExpense.id ? { ...e, ...values, id: e.id, date: values.date } : e);
        setExpenses(updatedExpenses);
        localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
        toast({ title: "Gasto actualizado" });
    } else {
        let newExpenses: Expense[] = [];
        if (values.paymentMethod === 'Crédito' && values.installments && values.installments > 1) {
            for (let i = 0; i < values.installments; i++) {
                const newDate = new Date(values.date);
                newDate.setMonth(newDate.getMonth() + i);
                const newExpense: Expense = {
                    id: `${new Date().toISOString()}-${i}`,
                    ...values,
                    amount: values.amount / values.installments,
                    date: newDate,
                    description: `${values.description} (Cuota ${i+1}/${values.installments})`
                };
                newExpenses.push(newExpense);
            }
            toast({ title: `Gasto en ${values.installments} cuotas agregado!` });
        } else {
            const newExpense: Expense = { id: new Date().toISOString(), ...values };
            newExpenses.push(newExpense);
            toast({ title: "Gasto agregado exitosamente" });
        }
        const updated = [...expenses, ...newExpenses];
        setExpenses(updated);
        localStorage.setItem("expenses", JSON.stringify(updated));
    }
    
    form.reset();
    setEditingExpense(null);
    setDialogOpen(false);
  }

  const handleDelete = (id: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem("expenses", JSON.stringify(updatedExpenses));
    toast({ title: "Gasto eliminado", variant: "destructive" });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setDialogOpen(true);
  };
  
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
  
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(new Date(0, i), "LLLL", { locale: es }),
  }));
  
  const currentYear = getYear(new Date());
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CreditCard className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Gestión de Gastos</CardTitle>
              <CardDescription>Registra y administra tus gastos.</CardDescription>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <Select value={getMonth(selectedDate).toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Mes" /></SelectTrigger>
                <SelectContent>
                {months.map((month) => (<SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>))}
                </SelectContent>
            </Select>
            <Select value={getYear(selectedDate).toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full md:w-[120px]"><SelectValue placeholder="Año" /></SelectTrigger>
                <SelectContent>
                {years.map((year) => (<SelectItem key={year} value={year}>{year}</SelectItem>))}
                </SelectContent>
            </Select>
             <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) setEditingExpense(null); setDialogOpen(open); }}>
                <DialogTrigger asChild>
                <Button onClick={() => { setEditingExpense(null); setDialogOpen(true); }} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{editingExpense ? "Editar" : "Registrar"} Gasto</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField name="description" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input placeholder="Ej: Cena" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="amount" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" placeholder="Ej: 150.50" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="date" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover>
                            <PopoverTrigger asChild><FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button></FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                        </Popover><FormMessage /></FormItem>
                    )} />
                    <FormField name="paymentMethod" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Método de Pago</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger>
                            <SelectValue placeholder="Selecciona un método" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Débito">Débito</SelectItem>
                                <SelectItem value="Crédito">Crédito</SelectItem>
                                <SelectItem value="Efectivo">Efectivo</SelectItem>
                                <SelectItem value="Transferencia">Transferencia</SelectItem>
                            </SelectContent></Select><FormMessage /></FormItem>
                    )} />
                    {paymentMethod && paymentMethod !== 'Efectivo' && (
                        <FormField name="bank" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Banco</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                            <SelectValue placeholder="Selecciona un banco" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {banks.map(bank => (<SelectItem key={bank.id} value={bank.name}>{bank.name}</SelectItem>))}
                            </SelectContent></Select><FormMessage /></FormItem>
                        )} />
                    )}
                    {paymentMethod === 'Crédito' && (
                        <>
                        <FormField name="card" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Tarjeta</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger>
                                <SelectValue placeholder="Selecciona una tarjeta" /></SelectTrigger></FormControl>
                                <SelectContent>
                                {cards.map(card => (<SelectItem key={card.id} value={card.name}>{card.name}</SelectItem>))}
                                </SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField name="installments" control={form.control} render={({ field }) => (
                            <FormItem><FormLabel>Cuotas</FormLabel><FormControl><Input type="number" placeholder="1" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        </>
                    )}
                    <FormField name="isSaving" control={form.control} render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel>¿Marcar como Ahorro?</FormLabel></div>
                        </FormItem>
                    )} />
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Monto</TableHead><TableHead>Fecha</TableHead><TableHead>Método</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.description}</TableCell>
                  <TableCell>${expense.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(expense.date, "dd/MM/yyyy")}</TableCell>
                  <TableCell>{expense.paymentMethod}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el gasto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(expense.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GastosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GastosPageComponent />
    </Suspense>
  )
}
