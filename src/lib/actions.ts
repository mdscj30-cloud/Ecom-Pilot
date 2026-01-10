"use server";

import {
  generateInventoryRecommendations,
  type InventoryRecommendationsInput,
  type InventoryRecommendationsOutput,
} from "@/ai/flows/generate-inventory-recommendations";

export async function getAiRecommendations(
  input: InventoryRecommendationsInput
): Promise<{
  success: boolean;
  data?: InventoryRecommendationsOutput;
  error?: string;
}> {
  try {
    const recommendations = await generateInventoryRecommendations(input);
    if (!recommendations) {
      throw new Error("AI returned no data.");
    }
    return { success: true, data: recommendations };
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      success: false,
      error: `Failed to generate recommendations: ${errorMessage}`,
    };
  }
}
