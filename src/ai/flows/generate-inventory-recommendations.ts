'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating inventory recommendations.
 *
 * It takes into account current stock levels, DRR (Daily Run Rate), and a target ROAS to provide actionable insights.
 * - generateInventoryRecommendations - The main function to trigger the inventory recommendation flow.
 * - InventoryRecommendationsInput - The input type for the generateInventoryRecommendations function.
 * - InventoryRecommendationsOutput - The output type for the generateInventoryRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InventoryItemSchema = z.object({
  sku: z.string().describe('The stock keeping unit identifier.'),
  channel: z.string().describe('The channel where the product is sold (e.g., Amazon, Meesho).'),
  stockLevel: z.number().describe('The current stock level of the product.'),
  drr: z.number().describe('The daily run rate (units sold per day).'),
  price: z.number().describe('The price of the item.'),
  shipping: z.number().describe('The shipping cost of the item.'),
  commission: z.number().describe('The commission fee for the item.'),
});

const InventoryRecommendationsInputSchema = z.object({
  inventoryItems: z.array(InventoryItemSchema).describe('A list of inventory items with their details.'),
  targetRoas: z.number().describe('The target Return on Ad Spend (ROAS).'),
});
export type InventoryRecommendationsInput = z.infer<typeof InventoryRecommendationsInputSchema>;

const RecommendationSchema = z.object({
  sku: z.string().describe('The stock keeping unit identifier.'),
  recommendation: z.string().describe('The AI-generated recommendation (e.g., Restock, Reduce).'),
  reason: z.string().describe('The reason for the recommendation.'),
});

const InventoryRecommendationsOutputSchema = z.array(RecommendationSchema);
export type InventoryRecommendationsOutput = z.infer<typeof InventoryRecommendationsOutputSchema>;

export async function generateInventoryRecommendations(
  input: InventoryRecommendationsInput
): Promise<InventoryRecommendationsOutput> {
  return generateInventoryRecommendationsFlow(input);
}

const inventoryRecommendationsPrompt = ai.definePrompt({
  name: 'inventoryRecommendationsPrompt',
  input: {schema: InventoryRecommendationsInputSchema},
  output: {schema: InventoryRecommendationsOutputSchema},
  prompt: `You are an AI assistant specializing in providing inventory recommendations for e-commerce businesses.

  Based on the provided inventory data, DRR (Daily Run Rate), and target ROAS, provide a recommendation for each SKU.

  Your recommendations should focus on optimizing inventory levels and improving profitability.

  Consider the following factors when generating recommendations:
  - Stock levels: Are they sufficient to meet demand?
  - DRR: How quickly are products selling?
  - Target ROAS: Are ad campaigns performing well?

  Here's the inventory data:
  {{#each inventoryItems}}
  - SKU: {{sku}}, Channel: {{channel}}, Stock: {{stockLevel}}, DRR: {{drr}}, Price: {{price}}, Shipping: {{shipping}}, Commission: {{commission}}
  {{/each}}

  Target ROAS: {{targetRoas}}

  Provide a recommendation and a brief reason for each SKU. The recommendation should be one of the following: "Restock", "Reduce", or "OK".
  The output should be a JSON array of objects, each object containing the sku, recommendation and reason.
  Ensure you generate valid and parseable JSON.
  `,
});

const generateInventoryRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateInventoryRecommendationsFlow',
    inputSchema: InventoryRecommendationsInputSchema,
    outputSchema: InventoryRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await inventoryRecommendationsPrompt(input);
    return output!;
  }
);
