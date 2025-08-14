
"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Landmark, PlusCircle, Edit, Trash2, ShieldQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bank, Account } from "@/types";
import { getBanks, saveBank, deleteBank, saveAccount, deleteAccount } from '@/lib/actions';

const bankSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
});

const accountSchema = z.object({
  name: z.string().min(2, "El nombre es requerido."),
  currency: z.enum(["ARS", "USD"], { required_error: "La moneda es requerida."}),
  cbu: z.string().optional(),
  alias: z.string().optional(),
});


export default function BancosPage() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isBankDialogOpen, setBankDialogOpen] = useState(false);
  const [isAccountDialogOpen, setAccountDialogOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchBanks() {
      const fetchedBanks = await getBanks();
      setBanks(fetchedBanks);
    }
    fetchBanks();
  }, []);

  const bankForm = useForm<z.infer<typeof bankSchema>>({
    resolver: zodResolver(bankSchema),
    defaultValues: { name: "" },
  });

  const accountForm = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", currency: "ARS", cbu: "", alias: "" },
  });

  useEffect(() => {
    if (editingBank) {
      bankForm.reset({ name: editingBank.name });
    } else {
      bankForm.reset({ name: "" });
    }
  }, [editingBank, bankForm]);
  
  useEffect(() => {
    if (editingAccount) {
      accountForm.reset(editingAccount);
    } else {
      accountForm.reset({ name: "", currency: "ARS", cbu: "", alias: "" });
    }
  }, [editingAccount, accountForm, isAccountDialogOpen]);

  const handleBankFormSubmit = async (formData: FormData) => {
    const result = await saveBank(formData);
    if (result?.success) {
        toast({ title: editingBank ? "Banco actualizado" : "Banco agregado" });
        const fetchedBanks = await getBanks();
        setBanks(fetchedBanks);
        setBankDialogOpen(false);
        setEditingBank(null);
    } else {
        // Handle errors, maybe show a toast
        toast({ title: "Error", description: result?.message, variant: "destructive" });
    }
  };
  
  const handleAccountFormSubmit = async (formData: FormData) => {
    if (!selectedBankId) return;
    formData.append('bankId', selectedBankId);
    if (editingAccount) {
      formData.append('id', editingAccount.id);
    }
    
    const result = await saveAccount(formData);
     if (result?.success) {
        toast({ title: editingAccount ? "Cuenta actualizada" : "Cuenta agregada" });
        const fetchedBanks = await getBanks();
        setBanks(fetchedBanks);
        setAccountDialogOpen(false);
        setEditingAccount(null);
        setSelectedBankId(null);
    } else {
        toast({ title: "Error", description: result?.message, variant: "destructive" });
    }
  };

  const handleBankDelete = async (id: string) => {
    const bankToDelete = banks.find(b => b.id === id);
    if (bankToDelete && !bankToDelete.isDeletable) {
      toast({ title: "Acción no permitida", description: "Esta cuenta bancaria no se puede eliminar.", variant: "destructive" });
      return;
    }
    await deleteBank(id);
    toast({ title: "Banco eliminado", variant: "destructive" });
    const fetchedBanks = await getBanks();
    setBanks(fetchedBanks);
  };
  
  const handleAccountDelete = async (accountId: string) => {
    await deleteAccount(accountId);
    toast({ title: "Cuenta eliminada", variant: "destructive" });
    const fetchedBanks = await getBanks();
    setBanks(fetchedBanks);
  }

  const openAccountDialog = (bankId: string, account: Account | null) => {
    setSelectedBankId(bankId);
    setEditingAccount(account);
    setAccountDialogOpen(true);
  }

  const closeAccountDialog = () => {
    setAccountDialogOpen(false);
    setEditingAccount(null);
    setSelectedBankId(null);
  }


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* DIALOG FOR ACCOUNT */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar" : "Agregar"} Cuenta</DialogTitle>
            </DialogHeader>
            <form action={handleAccountFormSubmit} className="space-y-4">
                 <Form {...accountForm}>
                    <FormField control={accountForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Nombre de la Cuenta</FormLabel><FormControl><Input placeholder="Ej: Caja de Ahorro" {...field} name="name" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={accountForm.control} name="currency" render={({ field }) => (
                        <FormItem><FormLabel>Moneda</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} name="currency">
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecciona una moneda" /></SelectTrigger></FormControl>
                                <SelectContent><SelectItem value="ARS">Pesos (ARS)</SelectItem><SelectItem value="USD">Dólares (USD)</SelectItem></SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={accountForm.control} name="cbu" render={({ field }) => (
                        <FormItem><FormLabel>CBU</FormLabel><FormControl><Input placeholder="0000..." {...field} value={field.value || ''} name="cbu"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={accountForm.control} name="alias" render={({ field }) => (
                        <FormItem><FormLabel>Alias</FormLabel><FormControl><Input placeholder="mi.alias" {...field} value={field.value || ''} name="alias" /></FormControl><FormMessage /></FormItem>
                    )} />
                 </Form>
                <DialogFooter>
                    <Button variant="outline" type="button" onClick={closeAccountDialog}>Cancelar</Button>
                    <Button type="submit">Guardar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Landmark className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Gestión de Bancos</CardTitle>
              <CardDescription>Agrega bancos y sus respectivas cuentas.</CardDescription>
            </div>
          </div>
          <Dialog open={isBankDialogOpen} onOpenChange={setBankDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingBank(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Banco
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingBank ? "Editar" : "Agregar"} Banco</DialogTitle>
              </DialogHeader>
               <form action={handleBankFormSubmit}>
                    {editingBank && <input type="hidden" name="id" value={editingBank.id} />}
                    <Form {...bankForm}>
                      <FormField control={bankForm.control} name="name" render={({ field }) => (
                          <FormItem><FormLabel>Nombre del Banco</FormLabel><FormControl><Input placeholder="Ej: Banco Nación" {...field} name="name"/></FormControl><FormMessage /></FormItem>
                      )} />
                    </Form>
                  <DialogFooter className="mt-4">
                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {banks.map((bank) => (
              <AccordionItem value={bank.id} key={bank.id}>
                <AccordionTrigger>
                    <div className="flex justify-between items-center w-full pr-4">
                         <div className="flex items-center gap-2">
                             <span className="font-medium">{bank.name}</span>
                             {bank.name === 'Ahorros' && (
                                 <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                         <button onClick={(e) => e.stopPropagation()}><ShieldQuestion className="h-4 w-4 text-muted-foreground" /></button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                         <AlertDialogHeader>
                                             <AlertDialogTitle>Cuentas de Ahorros</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                 Esta es una sección especial. Los gastos marcados como 'Ahorro' se acumulan aquí. Los gastos pagados desde esta cuenta deducen el total de tus ahorros. No se puede eliminar el banco, pero sí sus cuentas.
                                             </AlertDialogDescription>
                                         </AlertDialogHeader>
                                         <AlertDialogFooter><AlertDialogCancel>Entendido</AlertDialogCancel></AlertDialogFooter>
                                     </AlertDialogContent>
                                 </AlertDialog>
                             )}
                         </div>
                         <div className="flex items-center">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingBank(bank); setBankDialogOpen(true); }} disabled={!bank.isDeletable}><Edit className="h-4 w-4" /></Button>
                             <AlertDialog>
                                 <AlertDialogTrigger asChild>
                                     <Button variant="ghost" size="icon" disabled={!bank.isDeletable} onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                 </AlertDialogTrigger>
                                 <AlertDialogContent>
                                     <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el banco y todas sus cuentas.</AlertDialogDescription></AlertDialogHeader>
                                     <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleBankDelete(bank.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                 </AlertDialogContent>
                             </AlertDialog>
                         </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-4">
                    <Button variant="outline" size="sm" className="mb-4" onClick={() => openAccountDialog(bank.id, null)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Agregar Cuenta
                    </Button>
                    <Table>
                        <TableHeader><TableRow><TableHead>Cuenta</TableHead><TableHead>Moneda</TableHead><TableHead>CBU</TableHead><TableHead>Alias</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {bank.accounts && bank.accounts.map(account => (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>{account.currency}</TableCell>
                                    <TableCell>{account.cbu}</TableCell>
                                    <TableCell>{account.alias}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openAccountDialog(bank.id, account)}><Edit className="h-4 w-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esto eliminará la cuenta permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleAccountDelete(account.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!bank.accounts || bank.accounts.length === 0) && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No hay cuentas en este banco.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
