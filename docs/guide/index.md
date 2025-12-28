# Getting Started

Bridge AI is designed to simplify how developers interact with multiple AI providers. 

## Why Bridge AI?

In the rapidly evolving AI landscape, being locked into one provider is a risk. Bridge AI provides a consistent interface that lets you swap models or providers in seconds.

## Core Concepts

### The Client
The `BridgeAIClient` is the main entry point. It manages configurations and provider-specific authentication.

### Commands
Following AWS SDK v3, we use a command-based pattern. This makes your code more modular and easier to test.

```typescript
import { BridgeAIClient, ChatCommand } from '@himanshu-mamgain/bridge-ai'

const client = new BridgeAIClient({ provider: 'gemini' })
const response = await client.send(new ChatCommand({ prompt: 'Hello!' }))
```
