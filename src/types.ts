export type Provider = 'openai' | 'gemini' | 'claude' | 'perplexity' | 'deepseek';

export interface BridgeAIConfig {
  provider: Provider;
  apiKey?: string;
  baseUrl?: string;
  preInstructions?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatOptions {
  prompt: string;
  systemPrompt?: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  raw: any;
}
