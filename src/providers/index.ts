/**
 * AI Provider interfaces and base implementations
 */

import { CompletionRequest, CompletionResponse } from '../models';

export interface AIProvider {
  name: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
  listModels(): Promise<string[]>;
}

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  
  abstract complete(request: CompletionRequest): Promise<CompletionResponse>;
  
  abstract listModels(): Promise<string[]>;
}