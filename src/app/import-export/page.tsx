"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { FileDown, FileUp, CalendarIcon } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Income, Expense } from "@/types";
import { getIncomes, getExpenses } from "@/lib/actions";

export default function ImportExportPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor, selecciona un rango de fechas para exportar.",
        variant: "destructive",
      });
      return;
    }

    const incomesData = await getIncomes();
    const expensesData = await getExpenses();
    
    const incomesWithDates = incomesData.map((i:any) => ({...i, date: new Date(i.date)}));
    const expensesWithDates = expensesData.map((e:any) => ({...e, date: new Date(e.date)}));

    const filteredData = [
      ...incomesWithDates
        .filter(item => item.date >= startDate && item.date <= endDate)
        .map(item => ({
          fecha: format(item.date, "yyyy-MM-dd"),
          tipo: "Ingreso",
          descripcion: item.description,
          monto: item.amount,
          metodo_pago: "",
          origen_destino: item.source,
        })),
      ...expensesWithDates
        .filter(item => item.date >= startDate && item.date <= endDate)
        .map(item => ({
          fecha: format(item.date, "yyyy-MM-dd"),
          tipo: "Gasto",
          descripcion: item.description,
          monto: -item.amount, // Represent expenses as negative numbers
          metodo_pago: item.paymentMethod,
          origen_destino: item.bank || item.card || "",
        })),
    ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (filteredData.length === 0) {
      toast({
        title: "No hay datos",
        description: "No se encontraron datos en el rango de fechas seleccionado.",
      });
      return;
    }

    const headers = ["fecha", "tipo", "descripcion", "monto", "metodo_pago", "origen_destino"];
    const csvContent = [
      headers.join(","),
      ...filteredData.map(row => 
        headers.map(header => `"${row[header as keyof typeof row]}"`).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `financeflow_export_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Exportación exitosa", description: "Tus datos se han descargado." });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would parse the CSV and send it to the server.
      console.log("Importing file:", file.name);
      toast({ title: "Funcionalidad no implementada", description: `La importación de archivos CSV se agregará en una futura actualización.` });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <FileUp className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Importar y Exportar Datos</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileDown className="w-6 h-6" />
              <CardTitle>Exportar a CSV</CardTitle>
            </div>
            <CardDescription>
              Descarga una copia de seguridad de tus gastos e ingresos en formato CSV dentro de un rango de fechas específico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {startDate ? format(startDate, "PPP", { locale: es }) : <span>Desde</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
                 </Popover>
                 <Popover>
                   <PopoverTrigger asChild>
                     <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                       <CalendarIcon className="mr-2 h-4 w-4" />
                       {endDate ? format(endDate, "PPP", { locale: es }) : <span>Hasta</span>}
                     </Button>
                   </PopoverTrigger>
                   <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
                 </Popover>
            </div>
            <Button className="w-full" onClick={handleExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Datos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileUp className="w-6 h-6" />
              <CardTitle>Importar desde CSV</CardTitle>
            </div>
            <CardDescription>
              Sube un archivo CSV para agregar nuevos registros a tu cuenta. Asegúrate de que el formato sea correcto.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex w-full items-center space-x-2">
                <Input id="csv-import" type="file" accept=".csv" onChange={handleImport} className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
