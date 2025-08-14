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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, PlusCircle, Edit, Trash2, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import type { Income, Bank, DigitalWallet } from "@/types";
import { getIncomes, saveIncome, deleteIncome, getBanks, getWallets } from "@/lib/actions";

const incomeSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(3, "La descripción es requerida."),
  amount: z.preprocess((a) => parseFloat(z.string().parse(a)), z.number().positive("El monto debe ser positivo.")),
  date: z.date({ required_error: "La fecha es requerida." }),
  source: z.string({ required_error: "El origen es requerido." }),
});


function IngresosPageComponent() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const { toast } = useToast();
  const [sources, setSources] = useState<{ value: string, label: string }[]>([]);

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
  
  const fetchIncomes = async () => {
    const fetchedIncomes = await getIncomes();
    const incomesWithDates: Income[] = fetchedIncomes.map((i: any) => ({ ...i, date: new Date(i.date) }));
    setIncomes(incomesWithDates);
  }


  useEffect(() => {
    fetchIncomes();
    
    async function fetchSources() {
        const banks = await getBanks();
        const wallets = await getWallets();
        const combinedSources = [
            ...banks.map(b => ({ value: b.name, label: `Banco: ${b.name}` })),
            ...wallets.map(w => ({ value: w.name, label: `Billetera: ${w.name}` }))
        ];
        setSources(combinedSources);
    }
    fetchSources();
  }, []);

  useEffect(() => {
    const year = getYear(selectedDate);
    const month = getMonth(selectedDate);

    const filtered = incomes.filter(income => {
      const incomeDate = new Date(income.date);
      return getYear(incomeDate) === year && getMonth(incomeDate) === month;
    });
    setFilteredIncomes(filtered);

    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    params.set('month', month.toString());
    router.replace(`${pathname}?${params.toString()}`);

  }, [selectedDate, incomes, router, pathname, searchParams]);


  const form = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {},
  });
  
  useEffect(() => {
    if (editingIncome) {
      form.reset({
        ...editingIncome,
        date: new Date(editingIncome.date),
      });
    } else {
      form.reset({
        id: undefined,
        description: "",
        amount: 0,
        date: new Date(),
        source: ""
      });
    }
  }, [editingIncome, form, isDialogOpen]);

  async function onSubmit(values: z.infer<typeof incomeSchema>) {
    const result = await saveIncome(values);
    if(result.success) {
      toast({ title: editingIncome ? "Ingreso actualizado" : "Ingreso agregado" });
      fetchIncomes();
      setDialogOpen(false);
      setEditingIncome(null);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteIncome(id);
    if (result.success) {
        toast({ title: "Ingreso eliminado", variant: "destructive" });
        fetchIncomes();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }
  
  const handleEdit = (income: Income) => {
    setEditingIncome(income);
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
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Gestión de Ingresos</CardTitle>
              <CardDescription>Registra y administra tus ingresos.</CardDescription>
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
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) setEditingIncome(null); setDialogOpen(open); }}>
                <DialogTrigger asChild>
                <Button onClick={() => { setEditingIncome(null); setDialogOpen(true); }} className="w-full md:w-auto"><PlusCircle className="mr-2 h-4 w-4" /> Nuevo</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>{editingIncome ? "Editar" : "Registrar"} Ingreso</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField name="description" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Descripción</FormLabel><FormControl><Input placeholder="Ej: Salario" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="amount" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Monto</FormLabel><FormControl><Input type="number" placeholder="Ej: 3000" {...field} /></FormControl><FormMessage /></FormItem>
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
                    <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Origen (Banco/Billetera)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Selecciona un origen" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sources.map((source) => (
                                <SelectItem key={source.value} value={source.value}>
                                    {source.label}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <DialogFooter><DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar</Button></DialogFooter>
                    </form>
                </Form>
                </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader><TableRow><TableHead>Descripción</TableHead><TableHead>Monto</TableHead><TableHead>Fecha</TableHead><TableHead>Origen</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredIncomes.map((income) => (
                <TableRow key={income.id}>
                  <TableCell className="font-medium">{income.description}</TableCell>
                  <TableCell>${income.amount.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(income.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>{income.source}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(income)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de ingreso.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(income.id)}>Eliminar</AlertDialogAction>
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

export default function IngresosPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IngresosPageComponent />
    </Suspense>
  )
}
