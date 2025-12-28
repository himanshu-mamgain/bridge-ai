import { createHash } from 'crypto';

export function generateHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
