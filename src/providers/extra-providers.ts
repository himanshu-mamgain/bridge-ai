import { OpenAIProvider } from './openai';

export class PerplexityProvider extends OpenAIProvider {
  constructor(apiKey: string, preInstructions?: string, model: string = 'llama-3-sonar-large-32k-online') {
    super(apiKey, preInstructions, 'https://api.perplexity.ai', model);
  }
}

export class DeepSeekProvider extends OpenAIProvider {
  constructor(apiKey: string, preInstructions?: string, model: string = 'deepseek-chat') {
    super(apiKey, preInstructions, 'https://api.deepseek.com', model);
  }
}
