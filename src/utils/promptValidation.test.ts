import { describe, it, expect } from 'vitest';
import { PROMPT_MAX_LENGTH, isPromptLengthValid } from './promptValidation';

describe('isPromptLengthValid', () => {
  it('빈 문자열은 유효하다', () => {
    expect(isPromptLengthValid('')).toBe(true);
  });

  it('500자 이하이면 유효하다', () => {
    const prompt = 'a'.repeat(PROMPT_MAX_LENGTH);
    expect(isPromptLengthValid(prompt)).toBe(true);
  });

  it('500자를 초과하면 유효하지 않다', () => {
    const prompt = 'a'.repeat(PROMPT_MAX_LENGTH + 1);
    expect(isPromptLengthValid(prompt)).toBe(false);
  });
});
