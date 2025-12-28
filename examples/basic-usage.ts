import { BridgeAIClient, ChatCommand } from '../src';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  // Initialize with OpenAI (will look for OPENAI_API_KEY in env)
  const client = new BridgeAIClient({
    provider: 'openai',
    preInstructions: 'You are a poetic assistant.'
  });

  // Method 1: AWS SDK v3 Style (Command Pattern)
  console.log('--- Command Pattern ---');
  const command = new ChatCommand({
    prompt: 'Write a short poem about the bridge between two worlds.'
  });

  const response = await client.send(command);
  console.log('Poem:', response.text);

  // Method 2: High-level Wrapper
  console.log('\n--- High-level Wrapper ---');
  const response2 = await client.chat({
    prompt: 'What is the capital of France?'
  });
  console.log('Answer:', response2.text);
}

main().catch(console.error);
