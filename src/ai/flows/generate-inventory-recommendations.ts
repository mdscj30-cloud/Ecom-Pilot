'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating inventory and advertising recommendations.
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
  roas: z.number().describe('The current Return on Ad Spend for the item.'),
});

const InventoryRecommendationsInputSchema = z.object({
  inventoryItems: z.array(InventoryItemSchema).describe('A list of inventory items with their details.'),
  targetRoas: z.number().describe('The target Return on Ad Spend (ROAS).'),
});
export type InventoryRecommendationsInput = z.infer<typeof InventoryRecommendationsInputSchema>;

const RecommendationSchema = z.object({
  sku: z.string().describe('The stock keeping unit identifier.'),
  inventoryAction: z.string().describe('The recommendation for inventory (e.g., Restock, Reduce, OK).'),
  adAction: z.string().describe('The recommendation for advertising (e.g., Increase Spend, Pause Ads, Monitor).'),
  remarks: z.string().describe('A consolidated remark explaining the reasoning for the actions.'),
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
  prompt: `You are an AI assistant specializing in providing inventory and advertising recommendations for e-commerce businesses.

  Based on the provided inventory data, DRR (Daily Run Rate), current ROAS, and target ROAS, provide a recommendation for each SKU.
  Your recommendations should focus on optimizing inventory levels, ad spend, and overall profitability.

  For each SKU, provide:
  1.  **inventoryAction**: Should be one of "Restock", "Reduce", or "OK".
      - "Restock": If stock cover (stockLevel / DRR) is less than 7 days.
      - "Reduce": If stock cover is more than 60 days.
      - "OK": Otherwise.
  2.  **adAction**: Should be one of "Increase Spend", "Pause Ads", or "Monitor".
      - "Pause Ads": If stock cover is critically low (less than 3 days).
      - "Increase Spend": If the current ROAS is significantly above the target ROAS and stock cover is healthy (> 15 days).
      - "Monitor": For all other cases, including when ROAS is below target or stock is moderate.
  3.  **remarks**: A brief, consolidated reason for both actions. Mention key metrics like stock days and ROAS performance.

  Here's the inventory data:
  {{#each inventoryItems}}
  - SKU: {{sku}}, Channel: {{channel}}, Stock: {{stockLevel}}, DRR: {{drr}}, Price: {{price}}, Shipping: {{shipping}}, Commission: {{commission}}, ROAS: {{roas}}
  {{/each}}

  Target ROAS: {{targetRoas}}

  Provide the output as a valid JSON array of objects.
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
