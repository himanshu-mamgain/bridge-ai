import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, preInstructions?: string, baseUrl?: string, model: string = 'gpt-4-turbo-preview') {
    super(apiKey, preInstructions);
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: baseUrl
    });
    this.model = model;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];

    // Add pre-instructions (system prompt)
    if (this.preInstructions || options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt || this.preInstructions
      });
    }

    // Add history if provided
    if (options.messages) {
      messages.push(...options.messages);
    }

    // Add current prompt
    messages.push({ role: 'user', content: options.prompt });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      raw: completion,
    };
  }
}
