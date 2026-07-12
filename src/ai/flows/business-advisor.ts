
'use server';

import { ai } from '@/ai/genkit';
import { findCompanies, findProcedures } from '@/lib/actions';
import { z } from 'zod';

const findCompaniesTool = ai.defineTool(
  {
    name: 'findCompanies',
    description:
      'Busca empresas en el directorio por nombre, categoría o servicios ofrecidos.',
    inputSchema: z.object({
      query: z.string().describe('Término de búsqueda para empresas.'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        description: z.string(),
      })
    ),
  },
  async ({ query }) => {
    return findCompanies({ query, limit: 5 });
  }
);

const findProceduresTool = ai.defineTool(
  {
    name: 'findProcedures',
    description:
      'Busca trámites gubernamentales o administrativos por nombre o categoría.',
    inputSchema: z.object({
      query: z.string().describe('Término de búsqueda para trámites.'),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        category: z.string(),
        description: z.string(),
        institution: z.string(),
      })
    ),
  },
  async ({ query }) => {
    return findProcedures({ query, limit: 5 });
  }
);

const BusinessAdvisorInputSchema = z.object({
  question: z.string(),
});

const BusinessAdvisorOutputSchema = z.object({
  response: z
    .string()
    .describe('La respuesta a la pregunta del usuario, formateada como Markdown.'),
});

export async function businessAdvisor(
  input: z.infer<typeof BusinessAdvisorInputSchema>
): Promise<z.infer<typeof BusinessAdvisorOutputSchema>> {
  return businessAdvisorFlow(input);
}

const businessAdvisorFlow = ai.defineFlow(
  {
    name: 'businessAdvisorFlow',
    inputSchema: BusinessAdvisorInputSchema,
    outputSchema: BusinessAdvisorOutputSchema,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: `Eres un asistente experto en negocios en Guinea Ecuatorial para el directorio Oltinde. Responde la pregunta del usuario de forma concisa y útil. Utiliza las herramientas disponibles para buscar información en el directorio si es necesario. Formatea tu respuesta en Markdown.

Pregunta del usuario: ${input.question}`,
      model: 'googleai/gemini-1.5-flash',
      tools: [findCompaniesTool, findProceduresTool],
    });

    const choice = llmResponse.choices[0];
    const responseText = choice.message.content.map((part) => part.text || '').join('');

    return {
      response: responseText || "No se pudo generar una respuesta.",
    };
  }
);
