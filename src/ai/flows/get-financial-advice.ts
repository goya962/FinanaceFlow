
'use server';
/**
 * @fileOverview An AI agent that provides financial advice.
 * 
 * - getFinancialAdvice - A function that handles the financial analysis process.
 * - GetFinancialAdviceInput - The input type for the getFinancialAdvice function.
 * - GetFinancialAdviceOutput - The return type for the getFinancialAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// We need to define Zod schemas that match the data types from the client
const IncomeSchema = z.object({
    id: z.string(),
    description: z.string(),
    amount: z.number(),
    date: z.string(), // The client sends date strings
    source: z.string()
});

const ExpenseSchema = z.object({
    id: z.string(),
    description: z.string(),
    amount: z.number(),
    date: z.string(), // The client sends date strings
    paymentMethod: z.string(),
    bank: z.string().optional(),
    card: z.string().optional(),
    installments: z.number().optional(),
    isSaving: z.boolean().optional(),
});


const GetFinancialAdviceInputSchema = z.object({
  incomes: z.array(IncomeSchema),
  expenses: z.array(ExpenseSchema),
});
export type GetFinancialAdviceInput = z.infer<typeof GetFinancialAdviceInputSchema>;

const GetFinancialAdviceOutputSchema = z.object({
  advice: z.string().describe("Detailed financial advice based on the provided data. Should be formatted as markdown."),
});
export type GetFinancialAdviceOutput = z.infer<typeof GetFinancialAdviceOutputSchema>;

export async function getFinancialAdvice(input: GetFinancialAdviceInput): Promise<GetFinancialAdviceOutput> {
  const validatedInput = GetFinancialAdviceInputSchema.parse(input);
  return getFinancialAdviceFlow(validatedInput);
}

const getFinancialAdviceFlow = ai.defineFlow(
  {
    name: 'getFinancialAdviceFlow',
    inputSchema: GetFinancialAdviceInputSchema,
    outputSchema: GetFinancialAdviceOutputSchema,
  },
  async (input) => {
    // Now, we format the data specifically for the prompt, converting dates to strings.
    const formattedInputForPrompt = {
      ...input,
      incomes: input.incomes.map(i => ({...i, date: new Date(i.date).toISOString().split('T')[0]})),
      expenses: input.expenses.map(e => ({...e, date: new Date(e.date).toISOString().split('T')[0]}))
    }

    const { output } = await ai.generate({
        prompt: `
        Eres un asistente financiero experto. Tu tarea es analizar los datos de ingresos y gastos proporcionados por el usuario y ofrecer recomendaciones claras, accionables y personalizadas para mejorar su salud financiera.

        Analiza los siguientes datos:
        Ingresos:
        {{#each incomes}}
        - Descripción: {{description}}, Monto: {{amount}}, Fecha: {{date}}, Origen: {{source}}
        {{/each}}

        Gastos:
        {{#each expenses}}
        - Descripción: {{description}}, Monto: {{amount}}, Fecha: {{date}}, Método: {{paymentMethod}}{{#if bank}}, Banco: {{bank}}{{/if}}{{#if isSaving}}, (AHORRO){{/if}}
        {{/each}}

        Basado en este análisis, proporciona un resumen y luego una lista de recomendaciones.
        - Identifica los patrones de gasto más significativos.
        - Compara los ingresos totales con los gastos totales.
        - Evalúa la cantidad de dinero que se destina al ahorro.
        - Ofrece sugerencias específicas para reducir gastos innecesarios.
        - Propón estrategias de ahorro o inversión si es apropiado.
        - Mantén un tono alentador y de apoyo.
        - Formatea tu respuesta en markdown. Usa encabezados, listas con viñetas y negritas para que sea fácil de leer.
        `,
        input: formattedInputForPrompt,
        output: {
            schema: GetFinancialAdviceOutputSchema,
        }
    });
    
    if (!output) {
      throw new Error("The AI assistant did not return a response.");
    }
    return output;
  }
);
