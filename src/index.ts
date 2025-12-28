export * from './types';
import { BridgeAIConfig, ChatOptions, AIResponse, Provider } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { PerplexityProvider, DeepSeekProvider } from './providers/extra-providers';
import { BaseAIProvider } from './providers/base';
import { generateHash } from './utils';

export class BridgeAIClient {
  private config: BridgeAIConfig;
  private providerInstance: BaseAIProvider;
  private history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

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
    const apiKey = config.apiKey || this.getApiKeyFromEnv(config.provider);
    if (!apiKey) throw new Error(`API key missing for ${config.provider}`);

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(apiKey, config.preInstructions, config.baseUrl);
      case 'gemini':
        return new GeminiProvider(apiKey, config.preInstructions);
      case 'claude':
        return new ClaudeProvider(apiKey, config.preInstructions);
      case 'perplexity':
        return new PerplexityProvider(apiKey, config.preInstructions);
      case 'deepseek':
        return new DeepSeekProvider(apiKey, config.preInstructions);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Send a command with automatic retry/fallback and post-processing (hooks/hashing).
   */
  async send<T extends AIResponse>(command: Command<T>): Promise<T> {
    try {
      const response = await command.execute(this.providerInstance);
      await this.postProcess(command, response);
      return response;
    } catch (error) {
      if (this.config.fallbackProviders && this.config.fallbackProviders.length > 0) {
        for (const fallbackProvider of this.config.fallbackProviders) {
          try {
            const fallbackInstance = this.createProvider({ ...this.config, provider: fallbackProvider, apiKey: undefined });
            const response = await command.execute(fallbackInstance);
            await this.postProcess(command, response);
            return response;
          } catch (e) {
            continue;
          }
        }
      }
      throw error;
    }
  }

  private async postProcess(command: Command<any>, response: AIResponse) {
    if (command instanceof ChatCommand) {
      const options = command.getOptions();
      const hash = generateHash(options.prompt);
      response.hash = hash;

      if (options.memory) {
        this.history.push({ role: 'user', content: options.prompt });
        this.history.push({ role: 'assistant', content: response.text });
      }

      if (this.config.onResponse) {
        await this.config.onResponse({ prompt: options.prompt, response, hash });
      }
    }
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const opts = { ...options };
    if (opts.memory) {
      opts.messages = [...(this.history || []), ...(opts.messages || [])];
    }
    return this.send(new ChatCommand(opts));
  }
}

export abstract class Command<T> {
  abstract execute(provider: BaseAIProvider): Promise<T>;
}

export class ChatCommand extends Command<AIResponse> {
  constructor(private options: ChatOptions) {
    super();
  }

  getOptions(): ChatOptions {
    return this.options;
  }

  async execute(provider: BaseAIProvider): Promise<AIResponse> {
    return provider.chat(this.options);
  }
}
