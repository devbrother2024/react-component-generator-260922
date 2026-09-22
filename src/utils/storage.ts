import type { GeneratedComponent, Provider } from '../types';

export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  components: 'rcg:components',
} as const;

export function isValidProvider(value: unknown): value is Provider {
  return value === 'anthropic' || value === 'google';
}

export function parseStoredProvider(raw: string | null, fallback: Provider): Provider {
  return isValidProvider(raw) ? raw : fallback;
}

export function parseStoredApiKey(raw: string | null): string {
  return raw ?? '';
}

export function serializeComponents(components: GeneratedComponent[]): string {
  return JSON.stringify(components);
}

interface StoredComponentShape {
  id: string;
  prompt: string;
  code: string;
  createdAt: string;
}

function isStoredComponentShape(value: unknown): value is StoredComponentShape {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.prompt === 'string' &&
    typeof candidate.code === 'string' &&
    typeof candidate.createdAt === 'string'
  );
}

export function parseStoredComponents(raw: string | null): GeneratedComponent[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter(isStoredComponentShape)
    .map((item) => ({ ...item, createdAt: new Date(item.createdAt) }))
    .filter((item) => !Number.isNaN(item.createdAt.getTime()));
}
