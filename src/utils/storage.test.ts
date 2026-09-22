import { describe, it, expect } from 'vitest';
import {
  isValidProvider,
  parseStoredProvider,
  parseStoredApiKey,
  serializeComponents,
  parseStoredComponents,
} from './storage';
import type { GeneratedComponent } from '../types';

describe('isValidProvider', () => {
  it('anthropic은 유효한 provider다', () => {
    expect(isValidProvider('anthropic')).toBe(true);
  });

  it('google은 유효한 provider다', () => {
    expect(isValidProvider('google')).toBe(true);
  });

  it('정의되지 않은 provider 문자열은 유효하지 않다', () => {
    expect(isValidProvider('openai')).toBe(false);
  });

  it('null은 유효하지 않다', () => {
    expect(isValidProvider(null)).toBe(false);
  });

  it('undefined는 유효하지 않다', () => {
    expect(isValidProvider(undefined)).toBe(false);
  });
});

describe('parseStoredProvider', () => {
  it('저장된 값이 유효한 provider면 그대로 반환한다', () => {
    expect(parseStoredProvider('anthropic', 'google')).toBe('anthropic');
  });

  it('저장된 값이 null이면 기본값을 반환한다', () => {
    expect(parseStoredProvider(null, 'google')).toBe('google');
  });

  it('저장된 값이 유효하지 않은 provider면 기본값을 반환한다', () => {
    expect(parseStoredProvider('openai', 'google')).toBe('google');
  });
});

describe('parseStoredApiKey', () => {
  it('저장된 값이 있으면 그대로 반환한다', () => {
    expect(parseStoredApiKey('sk-ant-abc123')).toBe('sk-ant-abc123');
  });

  it('저장된 값이 null이면 빈 문자열을 반환한다', () => {
    expect(parseStoredApiKey(null)).toBe('');
  });
});

describe('serializeComponents', () => {
  it('createdAt을 ISO 문자열로 직렬화한다', () => {
    const components: GeneratedComponent[] = [
      {
        id: '1',
        prompt: '버튼 만들어줘',
        code: 'const A = () => <button />;',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ];

    const raw = serializeComponents(components);
    const parsed = JSON.parse(raw);

    expect(parsed).toEqual([
      {
        id: '1',
        prompt: '버튼 만들어줘',
        code: 'const A = () => <button />;',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
  });
});

describe('parseStoredComponents', () => {
  it('저장된 값이 null이면 빈 배열을 반환한다', () => {
    expect(parseStoredComponents(null)).toEqual([]);
  });

  it('잘못된 JSON 문자열이면 빈 배열을 반환한다', () => {
    expect(parseStoredComponents('{invalid json')).toEqual([]);
  });

  it('JSON이 배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseStoredComponents('{"foo":"bar"}')).toEqual([]);
  });

  it('유효한 배열이면 createdAt을 Date 인스턴스로 변환해 반환한다', () => {
    const raw = JSON.stringify([
      {
        id: '1',
        prompt: '버튼 만들어줘',
        code: 'const A = () => <button />;',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const result = parseStoredComponents(raw);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].prompt).toBe('버튼 만들어줘');
    expect(result[0].code).toBe('const A = () => <button />;');
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('필수 필드가 없는 항목은 걸러낸다', () => {
    const raw = JSON.stringify([{ id: '1', prompt: '버튼 만들어줘' }]);
    expect(parseStoredComponents(raw)).toEqual([]);
  });

  it('createdAt이 유효한 날짜가 아닌 항목은 걸러낸다', () => {
    const raw = JSON.stringify([
      { id: '1', prompt: '버튼 만들어줘', code: 'const A = () => null;', createdAt: 'not-a-date' },
    ]);
    expect(parseStoredComponents(raw)).toEqual([]);
  });
});
