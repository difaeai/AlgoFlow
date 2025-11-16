'use server';

/**
 * @fileOverview Provides personalized risk profile recommendations based on user inputs.
 *
 * - `getPersonalizedRiskProfile` -  A function that generates risk profile recommendations.
 * - `PersonalizedRiskProfileInput` - The input type for the `getPersonalizedRiskProfile` function.
 * - `PersonalizedRiskProfileOutput` - The return type for the `getPersonalizedRiskProfile` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRiskProfileInputSchema = z.object({
  desiredInvestmentUSD: z
    .number()
    .describe('The desired investment amount in USD.'),
  monthlyTargetPct: z
    .number()
    .describe('The desired monthly target percentage.'),
  subscriptionTier: z
    .enum(['Starter', 'Growth', 'Max'])
    .describe('The subscription tier of the user.'),
});
export type PersonalizedRiskProfileInput = z.infer<
  typeof PersonalizedRiskProfileInputSchema
>;

const PersonalizedRiskProfileOutputSchema = z.object({
  riskProfileRecommendation: z
    .string()
    .describe(
      'A personalized risk profile recommendation based on the user inputs.'
    ),
  suggestedStopLossPct: z
    .number()
    .describe(
      'The suggested stop loss percentage based on the risk profile.'
    ),
  suggestedDailyDrawdownPct: z
    .number()
    .describe(
      'The suggested daily drawdown percentage based on the risk profile.'
    ),
  suggestedMaxPositions: z
    .number()
    .describe('The suggested maximum number of open positions.'),
});
export type PersonalizedRiskProfileOutput = z.infer<
  typeof PersonalizedRiskProfileOutputSchema
>;

export async function getPersonalizedRiskProfile(
  input: PersonalizedRiskProfileInput
): Promise<PersonalizedRiskProfileOutput> {
  return personalizedRiskProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedRiskProfilePrompt',
  input: {schema: PersonalizedRiskProfileInputSchema},
  output: {schema: PersonalizedRiskProfileOutputSchema},
  prompt: `You are an expert financial advisor specializing in risk management for automated trading systems.

Based on the user's desired investment, monthly target, and subscription tier, provide a personalized risk profile recommendation, suggested stop loss percentage, suggested daily drawdown percentage, and suggested maximum number of open positions.  Consider the risk constraints of each subscription tier.

Subscription Tier: {{{subscriptionTier}}}
Desired Investment: {{{desiredInvestmentUSD}}}
Monthly Target: {{{monthlyTargetPct}}}%

Respond in the following JSON format:
{
  "riskProfileRecommendation": "<recommendation>",
  "suggestedStopLossPct": <number>,
  "suggestedDailyDrawdownPct": <number>,
  "suggestedMaxPositions": <number>
}
`,
});

const personalizedRiskProfileFlow = ai.defineFlow(
  {
    name: 'personalizedRiskProfileFlow',
    inputSchema: PersonalizedRiskProfileInputSchema,
    outputSchema: PersonalizedRiskProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
