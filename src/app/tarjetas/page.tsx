"use client";

import { useState, useEffect } from "react";
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

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CreditCard as CardType, Bank } from "@/types";
import { getCards, saveCard, deleteCard, getBanks } from "@/lib/actions";

const cardSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  bank: z.string().min(2, "El banco es requerido."),
});

export default function TarjetasPage() {
  const [cards, setCards] = useState<CardType[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardType | null>(null);
  const { toast } = useToast();

  const fetchCards = async () => {
    const fetchedCards = await getCards();
    setCards(fetchedCards);
  };
  
  const fetchBanks = async () => {
    const fetchedBanks = await getBanks();
    setBanks(fetchedBanks);
  }

  useEffect(() => {
    fetchCards();
    fetchBanks();
  }, []);

  const form = useForm<z.infer<typeof cardSchema>>({
    resolver: zodResolver(cardSchema),
    defaultValues: { name: "", bank: "" },
  });
  
  useEffect(() => {
    if (editingCard) {
      form.reset({ id: editingCard.id, name: editingCard.name, bank: editingCard.bank });
    } else {
      form.reset({ id: undefined, name: "", bank: "" });
    }
  }, [editingCard, form, isDialogOpen]);

  const onSubmit = async (values: z.infer<typeof cardSchema>) => {
    const result = await saveCard(values);
    if(result.success){
      toast({ title: editingCard ? "Tarjeta actualizada" : "Tarjeta agregada" });
      fetchCards();
      setDialogOpen(false);
      setEditingCard(null);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async (id: string) => {
    const result = await deleteCard(id);
    if(result.success) {
        toast({ title: "Tarjeta eliminada", variant: "destructive" });
        fetchCards();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CreditCard className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Gestión de Tarjetas</CardTitle>
              <CardDescription>
                Agrega, edita o elimina tus tarjetas de crédito.
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingCard(null); form.reset({ name: "", bank: ""}); setDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Tarjeta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCard ? "Editar" : "Agregar"} Tarjeta</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Nombre de la Tarjeta</FormLabel><FormControl><Input placeholder="Ej: Visa Signature" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="bank" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco Emisor</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un banco" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {banks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.name}>
                                {bank.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Banco</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>{card.bank}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCard(card); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                       <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>¿Estás seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará la tarjeta permanentemente.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(card.id)}>Eliminar</AlertDialogAction>
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
