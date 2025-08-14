"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PiggyBank, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSavingsGoal, saveSavingsGoal } from "@/lib/actions";

const savingsSchema = z.object({
  goal: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "El objetivo debe ser positivo").max(100, "El objetivo no puede ser mayor a 100%")
  ),
});

export default function AhorrosPage() {
  const { toast } = useToast();
  const [currentGoal, setCurrentGoal] = useState(0); 

  const form = useForm<z.infer<typeof savingsSchema>>({
    resolver: zodResolver(savingsSchema),
    defaultValues: {
      goal: currentGoal,
    },
  });

  useEffect(() => {
    async function fetchGoal() {
      const goal = await getSavingsGoal();
      setCurrentGoal(goal);
      form.setValue("goal", goal);
    }
    fetchGoal();
  }, [form]);

  async function onSubmit(values: z.infer<typeof savingsSchema>) {
    const result = await saveSavingsGoal(values.goal);
     if (result.success) {
      setCurrentGoal(values.goal);
      toast({
        title: "Objetivo de Ahorro Actualizado",
        description: `Tu nuevo objetivo es ahorrar el ${values.goal}% de tus ingresos.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <PiggyBank className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Objetivo de Ahorro</h1>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Configurar Objetivo Mensual</CardTitle>
          <CardDescription>
            Define qué porcentaje de tus ingresos mensuales te gustaría ahorrar.
            El objetivo actual es del <span className="font-bold text-primary">{currentGoal}%</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porcentaje de Ahorro (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" placeholder="Ej: 20" {...field} />
                        <span className="absolute inset-y-0 right-4 flex items-center text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Guardar Objetivo
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
