import axios from 'axios';
import { aiConfig } from '../../config/aiConfig';
import { IAIProvider, AIResponse, ChatMessage } from './IAIProvider';

export class DeepSeekProvider implements IAIProvider {
  async chatCompletion(messages: ChatMessage[]): Promise<AIResponse> {
    const response = await axios.post(
      `${aiConfig.baseUrl}/chat/completions`,
      { messages, model: aiConfig.model },
      { headers: { Authorization: `Bearer ${aiConfig.apiKey}` } }
    );
    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage
    };
  }
}