import { aiConfig } from '../../config/aiConfig';
import { IAIProvider } from './IAIProvider';
import { DeepSeekProvider } from './DeepSeekProvider';
import { OpenAIProvider } from './OpenAIProvider';

export class AIServiceFactory {
  static createProvider(): IAIProvider {
    switch (aiConfig.provider) {
      case 'openai': return new OpenAIProvider();
      case 'deepseek': default: return new DeepSeekProvider();
    }
  }
}