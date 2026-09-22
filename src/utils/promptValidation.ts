export const PROMPT_MAX_LENGTH = 500;

export function isPromptLengthValid(prompt: string): boolean {
  return prompt.length <= PROMPT_MAX_LENGTH;
}
