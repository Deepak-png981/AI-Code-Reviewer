export interface PRDetails {
  owner: string;
  repo: string;
  pull_number: number;
  title: string;
  description: string;
}

export interface ReviewComment {
  body: string;
  path: string;
  line: number;
}

export interface AIResponse {
  lineNumber: string;
  reviewComment: string;
  suggestion?: string;
}

export interface OpenAIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
} 

export type Prompt = string;

export enum ErrorSeverity {
  WARNING,
  ERROR,
  FATAL
}