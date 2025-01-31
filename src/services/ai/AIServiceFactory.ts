import { aiConfig } from '../../config/aiConfig';
import { IAIProvider } from './IAIProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { GeminiProvider } from './GeminiProvider';

export class AIServiceFactory {
  static createProvider(): IAIProvider {
    switch (aiConfig.provider) {
      case 'openai': return new OpenAIProvider();
      case 'deepseek': return new DeepSeekProvider();
      case 'gemini': return new GeminiProvider();
      default: return new GeminiProvider();
    }
  }
}