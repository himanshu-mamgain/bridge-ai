import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base';
import { AIResponse, ChatOptions } from '../types';

export class GeminiProvider extends BaseAIProvider {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, preInstructions?: string, model: string = 'gemini-1.5-flash') {
    super(apiKey, preInstructions);
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = model;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const systemPrompt = options.systemPrompt || this.preInstructions;
    
    const model = this.genAI.getGenerativeModel({ 
      model: this.model,
      ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
      tools: options.tools ? [{
        functionDeclarations: options.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters as any
        }))
      }] : undefined
    });

    const chat = model.startChat({
      history: options.messages?.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })) || [],
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        temperature: options.temperature,
      },
    });

    const result = await chat.sendMessage(options.prompt);
    const response = await result.response;
    const usageMetadata = response.usageMetadata;
    
    const functionCalls = response.candidates?.[0]?.content?.parts
      ?.filter(p => p.functionCall)
      .map(p => ({
        name: p.functionCall!.name,
        args: p.functionCall!.args
      }));

    return {
      text: response.text(),
      hash: '', // Set by client
      usage: usageMetadata ? {
        promptTokens: usageMetadata.promptTokenCount,
        completionTokens: usageMetadata.candidatesTokenCount,
        totalTokens: usageMetadata.totalTokenCount,
      } : {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      toolCalls: functionCalls,
      raw: response,
    };
  }
}
