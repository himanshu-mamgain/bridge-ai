import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions, StreamChunk } from '../types';
import { calculateCost } from '../utils';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string, preInstructions?: string, model: string = 'gemini-1.5-flash') {
    super(apiKey, preInstructions);
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.modelName = model;
  }

  private buildParts(options: ChatOptions) {
    const parts: any[] = [{ text: options.prompt }];
    
    if (options.images) {
      options.images.forEach(img => {
        if (img.type === 'base64') {
          parts.push({
            inlineData: {
              data: img.data,
              mimeType: img.mediaType || 'image/jpeg'
            }
          });
        }
      });
    }
    return parts;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const systemPrompt = options.systemPrompt || this.preInstructions;
    const modelName = options.model || this.modelName;

    const model = this.genAI.getGenerativeModel({ 
      model: modelName,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      tools: options.tools ? [{
        functionDeclarations: options.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters as any
        }))
      }] : undefined
    });

    const generationConfig: any = {
      maxOutputTokens: options.maxTokens,
      temperature: options.temperature,
    };

    if (options.responseFormat === 'json') {
      generationConfig.responseMimeType = 'application/json';
    }

    const chat = model.startChat({
      history: options.messages?.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })) || [],
      generationConfig,
    });

    const parts = this.buildParts(options);
    const result = await chat.sendMessage(parts);
    const response = await result.response;
    const usageMetadata = response.usageMetadata;
    const text = response.text();
    
    const functionCalls = response.candidates?.[0]?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => ({
        name: p.functionCall!.name,
        args: p.functionCall!.args
      }));

    const promptTokens = usageMetadata?.promptTokenCount || 0;
    const completionTokens = usageMetadata?.candidatesTokenCount || 0;

    return {
      text,
      hash: '', 
      json: options.responseFormat === 'json' ? JSON.parse(text) : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: usageMetadata?.totalTokenCount || 0,
      },
      cost: calculateCost('gemini', modelName, promptTokens, completionTokens),
      toolCalls: functionCalls,
      raw: response,
    };
  }

  async *chatStream(options: ChatOptions): AsyncIterable<StreamChunk> {
    const systemPrompt = options.systemPrompt || this.preInstructions;
    const modelName = options.model || this.modelName;
    const model = this.genAI.getGenerativeModel({ 
      model: modelName,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
    });

    const parts = this.buildParts(options);
    const result = await model.generateContentStream({
      contents: [
        ...(options.messages?.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })) || []),
        { role: 'user', parts }
      ],
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      }
    });

    for await (const chunk of result.stream) {
      yield {
        text: chunk.text(),
        isDone: false // Final chunk logic can be added if needed
      };
    }
  }
}
