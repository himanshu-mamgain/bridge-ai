export * from './types';
import { BridgeAIConfig, ChatOptions, AIResponse, Provider, StreamChunk } from './types';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { ClaudeProvider } from './providers/claude';
import { PerplexityProvider, DeepSeekProvider } from './providers/extra-providers';
import { BaseAIProvider } from './providers/base';
import { MockProvider } from './providers/mock';
import { generateHash, toTOON } from './utils';

export class BridgeAIClient {
  private config: BridgeAIConfig;
  private providerInstance: BaseAIProvider;
  private history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

  constructor(config: BridgeAIConfig) {
    this.config = {
      ...config,
      apiKey: config.apiKey || this.getApiKeyFromEnv(config.provider),
    };

    if (!this.config.apiKey && config.provider !== 'mock') {
      throw new Error(`API Key for ${config.provider} is missing. Please provide it in config or set relevant environment variable.`);
    }

    this.providerInstance = this.createProvider(this.config);
  }

  private getApiKeyFromEnv(provider: Provider): string | undefined {
    const envMap: Record<Provider, string | undefined> = {
      openai: 'OPENAI_API_KEY',
      gemini: 'GEMINI_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      perplexity: 'PERPLEXITY_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      mock: undefined,
    };
    const envVar = envMap[provider];
    return envVar ? process.env[envVar] : 'mock-key';
  }

  private createProvider(config: BridgeAIConfig): BaseAIProvider {
    const apiKey = config.apiKey || this.getApiKeyFromEnv(config.provider) || 'mock-key';
    const model = this.resolveModel(config.provider, config.model);

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(apiKey, config.preInstructions, config.baseUrl, model);
      case 'gemini':
        return new GeminiProvider(apiKey, config.preInstructions, model);
      case 'claude':
        return new ClaudeProvider(apiKey, config.preInstructions, model);
      case 'perplexity':
        return new PerplexityProvider(apiKey, config.preInstructions, model);
      case 'deepseek':
        return new DeepSeekProvider(apiKey, config.preInstructions, model);
      case 'mock':
        return new MockProvider();
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private resolveModel(provider: Provider, model?: string): string | undefined {
    if (this.config.modelAliases && model && this.config.modelAliases[model]) {
      return this.config.modelAliases[model];
    }
    return model;
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const { retries = 2, factor = 2, minTimeout = 1000 } = this.config.retryOptions || {};
    let attempt = 0;
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        const isRetryable = [429, 500, 502, 503, 504].includes(error.status || error.statusCode);
        if (attempt >= retries || !isRetryable) throw error;
        const delay = minTimeout * Math.pow(factor, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }

  /**
   * Send a command with automatic retry/fallback and post-processing.
   */
  async send<T extends AIResponse>(command: Command<T>): Promise<T> {
    try {
      const response = await this.withRetry(() => command.execute(this.providerInstance));
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
        
        // Handle Advanced Memory Strategies
        if (typeof options.memory === 'object') {
          if (options.memory.strategy === 'sliding-window') {
            this.history = this.history.slice(-(options.memory.limit * 2));
          }
        }
      }

      if (this.config.onResponse) {
        await this.config.onResponse({ prompt: options.prompt, response, hash });
      }
    }
  }

  private preprocessOptions(options: ChatOptions): ChatOptions {
    const opts = { ...options };
    if (opts.model) opts.model = this.resolveModel(this.config.provider, opts.model);
    
    // Automatic TOON compression
    if (opts.useToon) {
      if (typeof opts.prompt === 'object') {
        opts.prompt = toTOON(opts.prompt);
      }
      if (opts.messages) {
        opts.messages = opts.messages.map(m => ({
          ...m,
          content: typeof m.content === 'object' ? toTOON(m.content) : m.content
        }));
      }
    }

    if (opts.memory) {
      opts.messages = [...(this.history || []), ...(opts.messages || [])];
    }
    return opts;
  }

  async chat(options: ChatOptions): Promise<AIResponse> {
    const opts = this.preprocessOptions(options);
    return this.send(new ChatCommand(opts));
  }

  async *chatStream(options: ChatOptions): AsyncGenerator<StreamChunk> {
    const opts = this.preprocessOptions(options);
    const stream = this.providerInstance.chatStream(opts);
    for await (const chunk of stream) {
      yield chunk;
    }
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
