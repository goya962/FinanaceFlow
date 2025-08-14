"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { FileDown, FileUp, CalendarIcon, Settings, Database, Palette, Wifi, WifiOff, Loader2 } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Income, Expense } from "@/types";
import { getIncomes, getExpenses, checkDbConnection } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";


function ImportExportCard() {
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
            monto: -item.amount,
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
        console.log("Importing file:", file.name);
        toast({ title: "Funcionalidad no implementada", description: `La importación de archivos CSV se agregará en una futura actualización.` });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <FileUp className="w-6 h-6" />
                    <CardTitle>Importar y Exportar</CardTitle>
                </div>
                <CardDescription>
                Importa o exporta tus datos de ingresos y gastos en formato CSV.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="font-semibold mb-2">Exportar Datos</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
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
                        Exportar a CSV
                    </Button>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Importar Datos</h3>
                     <div className="flex w-full items-center space-x-2">
                        <Input id="csv-import" type="file" accept=".csv" onChange={handleImport} className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function AppearanceCard() {
    const { theme, setTheme } = useTheme();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Palette className="w-6 h-6" />
                    <CardTitle>Apariencia</CardTitle>
                </div>
                <CardDescription>
                Personaliza la apariencia de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode">Modo Oscuro</Label>
                    <Switch
                        id="dark-mode"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function SystemCard() {
    const [dbStatus, setDbStatus] = useState<'checking' | 'ok' | 'error'>('checking');

    useEffect(() => {
        checkDbConnection().then(result => {
            setDbStatus(result.ok ? 'ok' : 'error');
        })
    }, []);

    const onCheck = () => {
        setDbStatus('checking');
        checkDbConnection().then(result => {
            setDbStatus(result.ok ? 'ok' : 'error');
        })
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Database className="w-6 h-6" />
                    <CardTitle>Sistema</CardTitle>
                </div>
                <CardDescription>
                Verifica el estado de los servicios de la aplicación.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                        {dbStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                        {dbStatus === 'ok' && <Wifi className="h-5 w-5 text-green-500" />}
                        {dbStatus === 'error' && <WifiOff className="h-5 w-5 text-destructive" />}
                        <div>
                            <p className="font-semibold">Base de Datos</p>
                             <p className="text-sm text-muted-foreground">
                                {dbStatus === 'checking' && 'Comprobando conexión...'}
                                {dbStatus === 'ok' && 'Conectado exitosamente.'}
                                {dbStatus === 'error' && 'Error de conexión.'}
                            </p>
                        </div>
                    </div>
                     <Button variant="outline" size="sm" onClick={onCheck} disabled={dbStatus === 'checking'}>
                        {dbStatus === 'checking' ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Re-intentar'}
                     </Button>
                </div>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Ajustes</h1>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <SystemCard />
            <ImportExportCard />
        </div>
        <div className="space-y-8">
            <AppearanceCard />
        </div>
      </div>
    </div>
  );
}
