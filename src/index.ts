export * from './types';
import { BridgeAIConfig, ChatOptions, AIResponse, Provider } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { PerplexityProvider, DeepSeekProvider } from './providers/extra-providers';
import { BaseAIProvider } from './providers/base';

export class BridgeAIClient {
  private config: BridgeAIConfig;
  private providerInstance: BaseAIProvider;

  constructor(config: BridgeAIConfig) {
    this.config = {
      ...config,
      apiKey: config.apiKey || this.getApiKeyFromEnv(config.provider),
    };

    if (!this.config.apiKey) {
      throw new Error(`API Key for ${config.provider} is missing. Please provide it in config or set relevant environment variable.`);
    }

    this.providerInstance = this.createProvider(this.config);
  }

  private getApiKeyFromEnv(provider: Provider): string | undefined {
    const envMap: Record<Provider, string> = {
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      perplexity: 'PERPLEXITY_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
    };
    return process.env[envMap[provider]];
  }

  private createProvider(config: BridgeAIConfig): BaseAIProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config.apiKey!, config.preInstructions, config.baseUrl);
      case 'gemini':
        return new GeminiProvider(config.apiKey!, config.preInstructions);
      case 'claude':
        return new ClaudeProvider(config.apiKey!, config.preInstructions);
      case 'perplexity':
        return new PerplexityProvider(config.apiKey!, config.preInstructions);
      case 'deepseek':
        return new DeepSeekProvider(config.apiKey!, config.preInstructions);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Send a command to the AI provider.
   * This mimics AWS SDK v3's .send() method.
   */
  async send<T extends AIResponse>(command: Command<T>): Promise<T> {
    return command.execute(this.providerInstance);
  }

  /**
   * High-level chat method for convenience.
   */
  async chat(options: ChatOptions): Promise<AIResponse> {
    return this.providerInstance.chat(options);
  }
}

export abstract class Command<T> {
  abstract execute(provider: BaseAIProvider): Promise<T>;
}

export class ChatCommand extends Command<AIResponse> {
  constructor(private options: ChatOptions) {
    super();
  }

  async execute(provider: BaseAIProvider): Promise<AIResponse> {
    return provider.chat(this.options);
  }
}
