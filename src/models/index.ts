/**
 * Model definitions and interfaces
 */

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface CompletionResponse {
  id: string;
  model: string;
  choices: Choice[];
  usage?: Usage;
}

export interface Choice {
  index: number;
  message: Message;
  finishReason?: string;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}