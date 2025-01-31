import axios from 'axios';
import { aiConfig } from '../../config/aiConfig';
import { IAIProvider, AIResponse, ChatMessage } from './IAIProvider';

export class GeminiProvider implements IAIProvider {
  async chatCompletion(messages: ChatMessage[]): Promise<AIResponse> {
    // Google Gemini API request format
    const requestBody = {
      contents: messages.map(msg => ({
        role: msg.role, // 'user' or 'assistant'
        parts: [{ text: msg.content }]
      }))
    };

    // send request
    const response = await axios.post(
      `${aiConfig.baseUrl}/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`,
      requestBody
    );

    // parse respond
    const responseData = response.data;
    return {
      content: responseData.candidates[0]?.content?.parts[0]?.text || '',
      usage: responseData.usage || {}
    };
  }
}
