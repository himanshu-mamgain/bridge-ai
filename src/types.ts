export type Provider = 'openai' | 'gemini' | 'claude' | 'perplexity' | 'deepseek';

export interface BridgeAIConfig {
  provider: Provider;
  apiKey?: string;
  baseUrl?: string;
  preInstructions?: string;
  maxTokens?: number;
  temperature?: number;
  fallbackProviders?: Provider[];
  onResponse?: (data: { prompt: string; response: AIResponse; hash: string }) => Promise<void> | void;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ChatOptions {
  prompt: string;
  systemPrompt?: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  tools?: Tool[];
  memory?: boolean; // If true, maintains context automatically (internal to client later)
}

export interface AIResponse {
  text: string;
  hash: string; // Added hashing for prompts
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    name: string;
    args: any;
  }>;
  raw: any;
}
