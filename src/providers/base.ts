import { AIResponse, ChatOptions, StreamChunk } from '../types';

export abstract class BaseAIProvider {
  protected apiKey: string;
  protected preInstructions?: string;

  constructor(apiKey: string, preInstructions?: string) {
    this.apiKey = apiKey;
    this.preInstructions = preInstructions;
  }

  abstract chat(options: ChatOptions): Promise<AIResponse>;
  abstract chatStream(options: ChatOptions): AsyncIterable<StreamChunk>;
}
