# 🌉 Bridge AI SDK

[![npm version](https://img.shields.io/npm/v/bridge-ai.svg?style=flat-square)](https://www.npmjs.com/package/bridge-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Bridge AI** is a unified, type-safe SDK for interacting with multiple AI providers (OpenAI, Gemini, Claude, Perplexity, and DeepSeek). Designed with the elegance and modularity of **AWS SDK v3**, it provides a seamless interface whether you're building a simple bot or a complex multi-model application.

## ✨ Features

- 🎯 **Unified Interface**: One SDK to rule them all. Switch providers by changing a single config line.
- 🌊 **Real-time Streaming**: Unified `AsyncIterable` stream support across all providers.
- 🏗️ **AWS SDK v3 Inspired**: Familiar Client-Command pattern for modularity.
- 🛡️ **Structured Output**: Built-in support for JSON mode and Schema validation.
- 🧠 **Agentic Nature**: Native support for tools (function calling) and smart memory.
- 🖼️ **Multimodal**: Unified interface for vision-based prompts.
- 💰 **Cost Auditing**: Automatic token tracking and cost estimation per request.
- ⚡ **TOON Compression**: Save up to 40% on tokens by using TOON for structured data.
- 🔄 **Heavy Duty**: Built-in retries with exponential backoff and provider fallbacks.

## 🚀 Installation

```bash
npm install bridge-ai
```

## 🛠️ Quick Start

### 1. Set up your Environment Variables
```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
ANTHROPIC_API_KEY=...
```

### 2. Basic Usage
```typescript
import { BridgeAIClient } from 'bridge-ai';

const client = new BridgeAIClient({ provider: 'openai' });

const response = await client.chat({ 
  prompt: 'What is the future of AI?' 
});

console.log(response.text);
console.log(`Cost: $${response.cost}`); // $0.00004
```

## 🧠 Advanced Features

### 🌊 Unified Streaming
Get real-time responses with a single unified interface.

```typescript
const stream = client.chatStream({ prompt: 'Write a long story...' });

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

### 🛡️ Structured Output (JSON Mode)
Force the model to return valid JSON.

```typescript
const res = await client.chat({
  prompt: 'List 3 fruits',
  responseFormat: 'json'
});
console.log(res.json); // [{name: "Apple"}, ...]
```

### 🖼️ Vision (Multimodal)
Send images to any supported model consistently.

```typescript
const res = await client.chat({
  prompt: 'What is inside this image?',
  images: [{ 
    type: 'url', 
    data: 'https://example.com/photo.jpg' 
  }]
});
```

### 🔄 Fallbacks & Retries
Ensure 100% uptime by defining fallbacks. Bridge AI also automatically retries on rate limits (429) or server errors.

```typescript
const client = new BridgeAIClient({
  provider: 'openai',
  fallbackProviders: ['gemini', 'claude'],
  retryOptions: { retries: 3 }
});
```

### ⚡ TOON Token Compression
Bridge AI is the first SDK to natively support **TOON** (Token-Oriented Object Notation). Use it to send complex structured data (like large arrays or objects) while saving up to 40% on token costs compared to JSON.

```typescript
const res = await client.chat({
  prompt: { user: 'Alice', history: [...lots of data] },
  useToon: true // Automatically serializes prompt to TOON
});
```

### 🔐 Persistence Hooks & Hashing
Every prompt is hashed (SHA-256). Use the `onResponse` hook to save to your database.

```typescript
const client = new BridgeAIClient({
  onResponse: ({ prompt, response, hash }) => {
    db.save({ hash, text: response.text });
  }
});
```

### 🛠️ Agentic Tools
```typescript
const response = await client.chat({
  prompt: 'What is the weather?',
  tools: [{
    name: 'getWeather',
    description: 'Get weather',
    parameters: { ... }
  }]
});

if (response.toolCalls) {
  // Execute function calls
}
```

### 🧪 Testing & Mocking
Test your app without spending a cent.

```typescript
const client = new BridgeAIClient({ provider: 'mock' });
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
Visit our [GitHub Pages](https://himanshu-mamgain.github.io/bridge-ai) for full API reference.

## 📄 License
MIT © [Himanshu Mamgain](https://github.com/himanshu-mamgain)
