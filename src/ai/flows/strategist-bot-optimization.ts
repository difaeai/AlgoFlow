'use server';

/**
 * @fileOverview A Genkit flow for the Strategist Bot that dynamically adjusts trading strategies based on real-time market sentiment and news analysis.
 *
 * - optimizeStrategy - A function that optimizes trading strategies.
 * - OptimizeStrategyInput - The input type for the optimizeStrategy function.
 * - OptimizeStrategyOutput - The return type for the optimizeStrategy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeStrategyInputSchema = z.object({
  venueType: z.enum(['BINANCE', 'EXNESS']).describe('The type of the trading venue.'),
  symbol: z.string().describe('The trading symbol (e.g., BTCUSD).'),
  timeframe: z.string().describe('The timeframe for analysis (e.g., 15m, 1h).'),
  indicatorsJson: z.string().describe('JSON string of technical indicators data.'),
  confidence: z.number().describe('Confidence level of the trading signal.'),
  desiredInvestmentUSD: z.number().describe('The user specified investment amount in USD'),
  monthlyTargetPct: z.number().describe('The user specified monthly target percentage'),
  riskMode: z.string().describe('The user specified risk mode'),
  stopLossPct: z.number().describe('The user specified stop loss percentage'),
  dailyDrawdownPct: z.number().describe('The user specified daily drawdown percentage'),
  maxPositions: z.number().describe('The user specified max positions'),
  tier: z.enum(['Starter', 'Growth', 'Max']).describe('The subscription tier of the user.'),
  recentNews: z.string().describe('Recent news headlines related to the trading symbol.'),
});
export type OptimizeStrategyInput = z.infer<typeof OptimizeStrategyInputSchema>;

const OptimizeStrategyOutputSchema = z.object({
  side: z.enum(['buy', 'sell']).describe('The suggested side of the trade.'),
  entry: z.number().describe('The suggested entry price.'),
  stopLoss: z.number().describe('The suggested stop loss price.'),
  takeProfits: z.array(z.number()).describe('An array of suggested take profit prices.'),
  positionSizing: z.number().describe('The suggested position size.'),
  notes: z.string().optional().describe('Any notes or considerations for the strategy.'),
});
export type OptimizeStrategyOutput = z.infer<typeof OptimizeStrategyOutputSchema>;

export async function optimizeStrategy(input: OptimizeStrategyInput): Promise<OptimizeStrategyOutput> {
  return optimizeStrategyFlow(input);
}

const optimizeStrategyPrompt = ai.definePrompt({
  name: 'optimizeStrategyPrompt',
  input: {schema: OptimizeStrategyInputSchema},
  output: {schema: OptimizeStrategyOutputSchema},
  prompt: `You are an expert trading strategist bot optimizing trading strategies based on technical indicators, risk settings, subscription tier constraints, and real-time market sentiment.

  Analyze the following information to generate an optimal trading strategy:

  Venue Type: {{{venueType}}}
  Symbol: {{{symbol}}}
  Timeframe: {{{timeframe}}}
  Indicators: {{{indicatorsJson}}}
  Confidence: {{{confidence}}}
  Investment Amount: {{{desiredInvestmentUSD}}}
  Monthly Target: {{{monthlyTargetPct}}}
  Risk Mode: {{{riskMode}}}
  Stop Loss Percentage: {{{stopLossPct}}}
  Daily Drawdown Percentage: {{{dailyDrawdownPct}}}
  Max Positions: {{{maxPositions}}}
  Subscription Tier: {{{tier}}}
  Recent News: {{{recentNews}}}

  Based on the above information, provide a JSON object with the optimal trading strategy. Ensure that the strategy aligns with the user's risk profile and subscription tier constraints. Take into account recent news sentiment to adjust the strategy conservatively or aggressively.

  The response should have the following format:
  {
    "side": "buy" | "sell",
    "entry": <number>,
    "stopLoss": <number>,
    "takeProfits": [<number>, <number>, ...],
    "positionSizing": <number>,
    "notes": <string, optional>
  }
`,
});

const optimizeStrategyFlow = ai.defineFlow(
  {
    name: 'optimizeStrategyFlow',
    inputSchema: OptimizeStrategyInputSchema,
    outputSchema: OptimizeStrategyOutputSchema,
  },
  async input => {
    const {output} = await optimizeStrategyPrompt(input);
    return output!;
  }
);
