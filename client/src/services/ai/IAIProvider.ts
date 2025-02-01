export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface IAIProvider {
  chatCompletion(messages: ChatMessage[]): Promise<AIResponse>;
}