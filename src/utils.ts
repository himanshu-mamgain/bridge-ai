import { createHash } from 'crypto';

export function generateHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function calculateCost(provider: string, model: string, promptTokens: number, completionTokens: number): number {
  const pricing: Record<string, { prompt: number; completion: number }> = {
    'openai:gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
    'openai:gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'claude:claude-3-5-sonnet-20240620': { prompt: 0.003, completion: 0.015 },
    'gemini:gemini-1.5-flash': { prompt: 0.000075, completion: 0.0003 },
  };

  const rate = pricing[`${provider}:${model}`] || { prompt: 0, completion: 0 };
  return (promptTokens / 1000) * rate.prompt + (completionTokens / 1000) * rate.completion;
}
