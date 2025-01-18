import axios from 'axios';

interface ApiResponseData {
  error?: string;
  message?: string;
}

interface ApiError extends Error {
  response?: {
    data?: ApiResponseData;
  };
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

const OPENAI_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const LLM_MODEL = 'deepseek-chat';
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const MAX_TOKEN_LIMIT = 2000; // Token limit for each chunk
const SUMMARY_TOKEN_LIMIT = 1500; // Token limit for each summary

const API_BASE = 'http://localhost:3001/api'; // 改为后端地址

// === 1) 搜索药物，与后端交互 ===
/**
 * Fetch drug data from the FDA API using the brand name.
 * @param drugName The brand name of the drug.
 * @returns A Promise that resolves to an array of Drug objects.
 */
export async function fetchDrugData(drugName: string) {
  try {
    // 调用后端 /drugs/search?name=xxx
    const response = await axios.get(`${API_BASE}/drugs/search`, {
      params: { name: drugName },
    });
    // 后端返回: { hitCache: boolean, data: {...} }
    return response.data;
  } catch (error) {
    const err = error as ApiError;
    throw new Error(err.response?.data?.error || 'Failed to fetch drug data');
  }
}

// === 2) 分析多个药物的相互作用 ===
/**
 * Analyze potential cross-reactions between drugs using OpenAI API.
 * @param drugIds An array of drug names.
 * @returns A Promise that resolves to a string containing the analysis.
 */
export async function analyzeDrugInteractions(drugIds: string[]) {
  try {
    // POST /interactions/analyze
    const response = await axios.post(`${API_BASE}/interactions/analyze`, {
      drugIds,
    });
    // 后端返回: { pairs: [ {drug1_id, drug2_id, analysis_text}, ... ] }
    return response.data;
  } catch (error) {
    const err = error as Error & { response?: { data?: { error?: string } } };
    throw new Error(err.response?.data?.error || 'Failed to analyze interactions');
  }
}

/**
 * Summarize a chunk of text using OpenAI API.
 * @param text The text to summarize.
 * @returns A Promise that resolves to the summary.
 */
async function summarizeText(text: string): Promise<string> {
  try {
    const prompt = `Summarize the following text to extract its key details and important points:\n\n${text}`;
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    const err = error as ApiError;
    console.log('API Key:', API_KEY);
    console.log('Request Headers:', {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`
    });
    console.error('Error summarizing text:', {
      message: err.message,
      response: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers ? Object.keys(err.config.headers) : null,
        data: err.config?.data
      }
    });
    throw new Error(`Failed to summarize text: ${err.message}. Please check API configuration.`);
  }
}

/**
 * Combine and summarize summaries if needed.
 * @param summaries An array of summaries.
 * @returns A single condensed summary.
 */
async function condenseSummaries(summaries: string[]): Promise<string[]> {
  if (summaries.join(' ').length <= MAX_TOKEN_LIMIT) {
    return summaries; // No further condensation needed
  }

  try {
    const prompt = `Combine and summarize the following summaries to reduce redundancy and keep only key points:\n\n${summaries.join('\n\n')}`;
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    return [response.data.choices[0].message.content.trim()];
  } catch (error) {
    const err = error as Error & { response?: { data?: unknown } };
    console.error('Error condensing summaries:', err.response?.data || err.message);
    throw new Error('Failed to condense summaries. Please try again.');
  }
}

/**
 * Answer a question based on the summarized prospectus using OpenAI API.
 * @param summaries The summarized prospectus content.
 * @param question The user query.
 * @returns A Promise that resolves to the final answer.
 */
async function generateAnswer(summaries: string[], question: string): Promise<string> {
  try {
    const prompt = `Based on the following summarized information, answer the user's question:\n\nSummaries:\n${summaries.join('\n\n')}\n\nQuestion:\n${question}\n\nIf the summaries do not contain relevant information, respond with: "Prospectus or prescribing info doesn't contain relevant information to answer the question."`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    const err = error as Error & { response?: { data?: unknown } };
    console.error('Error generating answer:', err.response?.data || err.message);
    throw new Error('Failed to generate an answer. Please try again.');
  }
}

/**
 * Chat with the drug's prescribing information using OpenAI API.
 * Handles long prospectus by summarizing it in chunks.
 * @param prospectus The full text of the prescribing information.
 * @param question The user query.
 * @returns A Promise that resolves to the answer or a fallback message.
 */
export async function chatWithProspectus(prospectus: string, question: string): Promise<string> {
  try {
    // Step 1: Split prospectus into chunks of MAX_TOKEN_LIMIT characters
    const chunks = prospectus.match(new RegExp(`.{1,${MAX_TOKEN_LIMIT}}`, 'g')) || [];

    // Step 2: Summarize each chunk
    let summaries = [];
    for (const chunk of chunks) {
      const summary = await summarizeText(chunk);
      summaries.push(summary);
    }

    // Step 3: Condense summaries if they exceed token limits
    while (summaries.join(' ').length > MAX_TOKEN_LIMIT) {
      summaries = await condenseSummaries(summaries);
    }

    // Step 4: Generate the final answer from condensed summaries
    return await generateAnswer(summaries, question);
  } catch (error) {
    const err = error as Error & {
      response?: { data?: unknown },
      config?: {
        url?: string,
        method?: string,
        headers?: Record<string, unknown>,
        data?: unknown
      }
    };
    console.error('Error in chatWithProspectus:', {
      message: err.message,
      response: err.response?.data,
      config: {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers ? Object.keys(err.config.headers) : null,
        data: err.config?.data
      }
    });
    throw new Error(`Failed to chat with the prospectus: ${err.message}. Please check your API key and network connection.`);
  }
}
