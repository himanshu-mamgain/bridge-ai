import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions } from '../types';

export class ClaudeProvider extends BaseAIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, preInstructions?: string, model: string = 'claude-3-5-sonnet-20240620') {
    super(apiKey, preInstructions);
    this.client = new Anthropic({
      apiKey: this.apiKey,
    });
    this.model = model;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const messages: any[] = [];
    
    if (options.messages) {
      messages.push(...options.messages.filter(m => m.role !== 'system'));
    }
    
    messages.push({ role: 'user', content: options.prompt });

    const system = options.systemPrompt || this.preInstructions;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      system: system,
      messages: messages,
      tools: options.tools?.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as any
      }))
    });

    const toolCalls = response.content
      .filter(c => c.type === 'tool_use')
      .map((tc: any) => ({
        name: tc.name,
        args: tc.input
      }));

    return {
      text: response.content[0].type === 'text' ? response.content[0].text : '',
      hash: '', // Set by client
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      toolCalls,
      raw: response,
    };
  }
}
