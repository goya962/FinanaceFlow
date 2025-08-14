"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Income, Expense } from "@/types";
import { getFinancialAdvice } from "@/ai/flows/get-financial-advice";
import { getIncomes, getExpenses } from "@/lib/actions";

export default function AssistantPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string>("");

  const handleGetRecommendations = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor, selecciona un rango de fechas para el análisis.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRecommendations("");

    try {
      const storedIncomes = await getIncomes();
      const storedExpenses = await getExpenses();

      const incomesWithDates = storedIncomes.map((i:any) => ({...i, date: new Date(i.date)}));
      const expensesWithDates = storedExpenses.map((e:any) => ({...e, date: new Date(e.date)}));

      const filteredIncomes = incomesWithDates.filter((item: Income) => item.date >= startDate && item.date <= endDate);
      const filteredExpenses = expensesWithDates.filter((item: Expense) => item.date >= startDate && item.date <= endDate);

      if (filteredIncomes.length === 0 && filteredExpenses.length === 0) {
        toast({
          title: "No hay datos",
          description: "No se encontraron datos en el rango de fechas seleccionado.",
        });
        setIsLoading(false);
        return;
      }
      
      const { advice } = await getFinancialAdvice({ 
          incomes: filteredIncomes.map(i => ({...i, date: i.date.toISOString()})), 
          expenses: filteredExpenses.map(e => ({...e, date: e.date.toISOString()}))
      });

      setRecommendations(advice);

    } catch (error) {
      console.error("Error getting financial advice:", error);
      toast({
        title: "Error del Asistente",
        description: "No se pudieron obtener las recomendaciones. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Asistente de Finanzas AI</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Obtener Recomendaciones</CardTitle>
          <CardDescription>
            Selecciona un rango de fechas para que la IA analice tus ingresos y gastos, y te ofrezca consejos para mejorar tu salud financiera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <Button className="w-full" onClick={handleGetRecommendations} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Consejos
              </>
            )}
          </Button>

          {recommendations && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Recomendaciones de la IA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br />') }} />
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
