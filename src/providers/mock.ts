import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions, StreamChunk } from '../types';

export class MockProvider extends BaseAIProvider {
  private mockResponses: AIResponse[] = [];
  private currentIdx = 0;

  constructor(responses?: AIResponse[]) {
    super('mock-key', 'mock-instructions');
    if (responses) this.mockResponses = responses;
  }

  setResponses(responses: AIResponse[]) {
    this.mockResponses = responses;
    this.currentIdx = 0;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const res = this.mockResponses[this.currentIdx] || {
      text: `Mock response to: ${options.prompt}`,
      hash: 'mock-hash',
      raw: {}
    };
    this.currentIdx = (this.currentIdx + 1) % this.mockResponses.length;
    return res;
  }

  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const text = `Mock stream response to: ${options.prompt}`;
    const words = text.split(' ');
    for (const word of words) {
      yield { text: word + ' ', isDone: false };
    }
    yield { text: '', isDone: true };
  }
}
