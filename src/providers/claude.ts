import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions, StreamChunk } from '../types';
import { calculateCost } from '../utils';

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

  private buildMessages(options: ChatOptions) {
    const messages: any[] = [];
    
    if (options.messages) {
      messages.push(...options.messages.filter(m => m.role !== 'system'));
    }
    
    const content: any[] = [{ type: 'text', text: options.prompt }];

    if (options.images) {
      options.images.forEach(img => {
        if (img.type === 'base64') {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: img.mediaType || 'image/jpeg',
              data: img.data,
            },
          });
        }
      });
    }

    messages.push({ role: 'user', content });
    return messages;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const messages = this.buildMessages(options);
    const system = options.systemPrompt || this.preInstructions;
    const model = options.model || this.model;

    const response = await this.client.messages.create({
      model: model,
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

    const text = response.content.find(c => c.type === 'text') ? (response.content.find(c => c.type === 'text') as any).text : '';
    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;

    return {
      text,
      hash: '', 
      json: options.responseFormat === 'json' ? JSON.parse(text) : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      cost: calculateCost('claude', model, promptTokens, completionTokens),
      toolCalls,
      raw: response,
    };
  }

  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const messages = this.buildMessages(options);
    const system = options.systemPrompt || this.preInstructions;
    const model = options.model || this.model;

    const stream = await this.client.messages.create({
      model: model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature,
      system: system,
      messages: messages,
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield {
          text: event.delta.text,
          isDone: false
        };
      } else if (event.type === 'message_stop') {
        yield { text: '', isDone: true };
      }
    }
  }
}
