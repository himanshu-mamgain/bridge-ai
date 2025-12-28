import { AIResponse, ChatOptions } from '../types';

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected preInstructions?: string;

  constructor(apiKey: string, preInstructions?: string) {
    this.apiKey = apiKey;
    this.preInstructions = preInstructions;
  }

  abstract chat(options: ChatOptions): Promise<AIResponse>;
}
