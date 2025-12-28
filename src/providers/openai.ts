import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions, StreamChunk } from '../types';
import { calculateCost } from '../utils';

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

  private buildMessages(options: ChatOptions) {
    const messages: any[] = [];

    if (this.preInstructions || options.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt || this.preInstructions
      });
    }

    if (options.messages) {
      messages.push(...options.messages);
    }

    const content: any[] = [{ type: 'text', text: options.prompt }];
    
    if (options.images) {
      options.images.forEach(img => {
        content.push({
          type: 'image_url',
          image_url: { url: img.type === 'base64' ? `data:${img.mediaType || 'image/jpeg'};base64,${img.data}` : img.data }
        });
      });
    }

    messages.push({ role: 'user', content });
    return messages;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const messages = this.buildMessages(options);
    const model = options.model || this.model;

    const completion = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      tools: options.tools?.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }
      })),
      response_format: options.responseFormat === 'json' ? { type: 'json_object' } : 
                       (typeof options.responseFormat === 'object' ? options.responseFormat : undefined),
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    });

    const toolCalls = completion.choices[0]?.message?.tool_calls?.map(tc => ({
      name: tc.function.name,
      args: JSON.parse(tc.function.arguments)
    }));

    const text = completion.choices[0]?.message?.content || '';
    const promptTokens = completion.usage?.prompt_tokens || 0;
    const completionTokens = completion.usage?.completion_tokens || 0;

    return {
      text,
      hash: '', 
      json: options.responseFormat ? (text ? JSON.parse(text) : undefined) : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: completion.usage?.total_tokens || 0,
      },
      cost: calculateCost('openai', model, promptTokens, completionTokens),
      toolCalls,
      raw: completion,
    };
  }

  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const messages = this.buildMessages(options);
    const model = options.model || this.model;
    const stream = await this.client.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    });

    for await (const chunk of stream) {
      yield {
        text: chunk.choices[0]?.delta?.content || '',
        isDone: chunk.choices[0]?.finish_reason !== null
      };
    }
  }
}
