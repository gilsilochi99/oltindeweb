
'use server';
/**
 * @fileoverview A flow that summarizes company reviews.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ReviewSummaryInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  reviews: z.array(z.string()).describe('A list of reviews for the company.'),
});

const ReviewSummaryOutputSchema = z.object({
  summary: z.string().describe('A one-paragraph summary of the reviews.'),
});

export async function summarizeCompanyReviews(
  input: z.infer<typeof ReviewSummaryInputSchema>
): Promise<z.infer<typeof ReviewSummaryOutputSchema>> {
  return summarizeCompanyReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCompanyReviewsPrompt',
  input: { schema: ReviewSummaryInputSchema },
  output: { schema: ReviewSummaryOutputSchema },
  prompt: `You are an expert business analyst. Summarize the following reviews for the company '{{{companyName}}}' into a single, concise paragraph. Capture the overall sentiment and common themes.

Reviews:
{{#each reviews}}
- {{{this}}}
{{/each}}
`,
});

const summarizeCompanyReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeCompanyReviewsFlow',
    inputSchema: ReviewSummaryInputSchema,
    outputSchema: ReviewSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
