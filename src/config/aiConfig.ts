type AIProvider = 'openai' | 'deepseek' | 'gemini';

interface AIConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const aiConfig: AIConfig = (() => {
  const provider = import.meta.env.VITE_AI_PROVIDER as AIProvider || 'deepseek';
  return {
    provider,
    baseUrl: import.meta.env[`VITE_${provider.toUpperCase()}_BASE_URL`],
    apiKey: import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`],
    model: import.meta.env[`VITE_${provider.toUpperCase()}_MODEL`]
  };
})();