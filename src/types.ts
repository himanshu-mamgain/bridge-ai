export type Provider = 'openai' | 'gemini' | 'claude' | 'perplexity' | 'deepseek' | 'mock';

export interface BridgeAIConfig {
  provider: Provider;
  apiKey?: string;
  baseUrl?: string;
  preInstructions?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  fallbackProviders?: Provider[];
  retryOptions?: {
    retries: number;
    factor?: number;
    minTimeout?: number;
  };
  modelAliases?: Record<string, string>;
  onResponse?: (data: { prompt: string; response: AIResponse; hash: string }) => Promise<void> | void;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ImageInput {
  type: 'url' | 'base64';
  data: string;
  mediaType?: string; // Example: 'image/jpeg'
}

export interface ChatOptions {
  prompt: string | any;
  model?: string;
  systemPrompt?: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string | any }>;
  maxTokens?: number;
  temperature?: number;
  tools?: Tool[];
  images?: ImageInput[];
  responseFormat?: 'text' | 'json' | { type: 'json_object'; schema?: any };
  memory?: boolean | { strategy: 'sliding-window' | 'summarize'; limit: number };
  useToon?: boolean; // If true, serializes structured data in prompt/messages using TOON for token savings
}

export interface AIResponse {
  text: string;
  hash: string;
  json?: any; // Set if responseFormat is json
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost?: number; // Estimated cost in USD
  toolCalls?: Array<{
    name: string;
    args: any;
  }>;
  raw: any;
}

export interface StreamChunk {
  text: string;
  isDone: boolean;
  toolCalls?: any[];
}
