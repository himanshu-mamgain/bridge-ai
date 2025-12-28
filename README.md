# 🌉 Bridge AI SDK

[![npm version](https://img.shields.io/npm/v/bridge-ai.svg?style=flat-square)](https://www.npmjs.com/package/bridge-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Bridge AI** is a unified, type-safe SDK for interacting with multiple AI providers (OpenAI, Gemini, Claude, Perplexity, and DeepSeek). Designed with the elegance and modularity of **AWS SDK v3**, it provides a seamless interface whether you're building a simple bot or a complex multi-model application.

## ✨ Features

- 🎯 **Unified Interface**: One SDK to rule them all. Switch providers by changing a single config line.
- 🏗️ **AWS SDK v3 Inspired**: Familiar Client-Command pattern for modularity.
- 🛡️ **Type-Safe**: Written in TypeScript with full type definitions.
- 🚀 **Environment Conscious**: Automatically picks up API keys from environment variables.
- ⚙️ **Configurable**: Define pre-instructions (system prompts) at the client level or per request.
- 📦 **Lightweight**: Zero-dependency core (using official SDKs under the hood for reliability).

## 🚀 Installation

```bash
npm install bridge-ai
```

## 🛠️ Quick Start

### 1. Set up your Environment Variables
Add your API keys to your `.env` file:
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
PERPLEXITY_API_KEY=...
DEEPSEEK_API_KEY=...
```

### 2. Basic Usage (TS/JS)

```typescript
import { BridgeAIClient, ChatCommand } from 'bridge-ai';

// Initialize the client
const client = new BridgeAIClient({
  provider: 'openai', // or 'gemini', 'claude', 'perplexity', 'deepseek'
  preInstructions: 'You are a helpful coding assistant.'
});

// Use the Command Pattern (AWS SDK v3 Style)
const command = new ChatCommand({
  prompt: 'How do I use Bridge AI?'
});

const response = await client.send(command);
console.log(response.text);
```

## 📐 Advanced Configuration

### Provider Specific Models
You can specify models and other parameters:

```typescript
const client = new BridgeAIClient({
  provider: 'claude',
  apiKey: 'custom-key-override', // Optional: Overrides env var
  preInstructions: 'System prompt goes here'
});

const response = await client.chat({
  prompt: 'Write a story',
  temperature: 0.7,
  maxTokens: 500
});
```

## 🤝 Supported Providers

| Provider | Config Name | Default Model | Env Variable |
| :--- | :--- | :--- | :--- |
| **OpenAI** | `openai` | `gpt-4-turbo-preview` | `OPENAI_API_KEY` |
| **Google Gemini** | `gemini` | `gemini-1.5-flash` | `GEMINI_API_KEY` |
| **Anthropic Claude** | `claude` | `claude-3-5-sonnet-20240620` | `ANTHROPIC_API_KEY` |
| **Perplexity** | `perplexity` | `llama-3-sonar-large-32k-online` | `PERPLEXITY_API_KEY` |
| **DeepSeek** | `deepseek` | `deepseek-chat` | `DEEPSEEK_API_KEY` |

## 📖 Documentation
For full documentation and advanced examples, visit our [GitHub Pages](https://himanshu-mamgain.github.io/bridge-ai).

## 📄 License
MIT © [Himanshu Mamgain](https://github.com/himanshu-mamgain)