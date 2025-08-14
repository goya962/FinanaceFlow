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
import { Wallet, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DigitalWallet } from "@/types";
import { getWallets, saveWallet, deleteWallet } from "@/lib/actions";


const walletSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
});

export default function BilleterasPage() {
  const [wallets, setWallets] = useState<DigitalWallet[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<DigitalWallet | null>(null);
  const { toast } = useToast();
  
  const fetchWallets = async () => {
      const fetchedWallets = await getWallets();
      setWallets(fetchedWallets);
    }

  useEffect(() => {
    fetchWallets();
  }, []);

  const form = useForm<z.infer<typeof walletSchema>>({
    resolver: zodResolver(walletSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (editingWallet) {
      form.reset({ id: editingWallet.id, name: editingWallet.name });
    } else {
      form.reset({ id: undefined, name: "" });
    }
  }, [editingWallet, form, isDialogOpen]);
  
  const handleFormSubmit = async (values: z.infer<typeof walletSchema>) => {
    const result = await saveWallet(values);
    if(result.success) {
      toast({ title: editingWallet ? "Billetera actualizada" : "Billetera agregada" });
      fetchWallets();
      setDialogOpen(false);
      setEditingWallet(null);
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async (id: string) => {
    const result = await deleteWallet(id);
    if (result.success) {
        toast({ title: "Billetera eliminada", variant: "destructive" });
        fetchWallets();
    } else {
         toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <Wallet className="w-8 h-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Gestión de Billeteras</CardTitle>
              <CardDescription>
                Agrega, edita o elimina tus billeteras digitales.
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingWallet(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Agregar Billetera
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingWallet ? "Editar" : "Agregar"} Billetera</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Billetera</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Ualá" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">{wallet.name}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingWallet(wallet); setDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                       <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>Esta acción eliminará la billetera permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(wallet.id)}>Eliminar</AlertDialogAction>
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
