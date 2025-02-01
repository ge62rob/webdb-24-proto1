import axios from 'axios';
import { AIServiceFactory } from './ai/AIServiceFactory';
import { ChatMessage } from './ai/IAIProvider';

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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

export async function analyzeTextWithAI(prompt: string): Promise<string> {
  try {
    const aiService = AIServiceFactory.createProvider();
    const messages: ChatMessage[] = [{
      role: 'user',
      content: prompt
    }];
    const response = await aiService.chatCompletion(messages);
    return response.content;
  } catch (error) {
    const err = error as ApiError;
    console.error('AI service call failed:', {
      message: err.message,
      config: {
        url: err.config?.url,
        method: err.config?.method
      }
    });
    throw new Error(err.response?.data?.error || 'AI service request failed');
  }
}

// ================ Core API Functions ================
export async function fetchDrugData(drugName: string) {
  try {
    const response = await axios.get(`${API_BASE}/drugs/search`, {
      params: { name: drugName },
    });
    return response.data;
  } catch (error) {
    const err = error as ApiError;
    throw new Error(err.response?.data?.error || 'Failed to fetch drug data');
  }
}

export async function analyzeDrugInteractions(drugIds: string[]) {
  try {
    const response = await axios.post(`${API_BASE}/interactions/analyze`, {
      drugIds,
    });
    return response.data;
  } catch (error) {
    const err = error as ApiError;
    throw new Error(err.response?.data?.error || 'Interaction analysis failed');
  }
}

// ================ Prospectus Chat ================
export async function chatWithProspectus(prospectus: string, question: string): Promise<string> {
  try {
    const fullPrompt = `Analyze the following drug monograph and answer the question strictly based on the provided information:
    
    ----- DRUG MONOGRAPH -----
    ${prospectus}
    --------------------------
    
    Question: ${question}
    
    Requirements:
    1. Answer in professional medical English
    2. Cite section references (e.g., "According to Section 5.1...")
    3. If no relevant information found, state "No relevant information found in the provided monograph"
    4. Highlight contraindications and black box warnings first if present
    
    Provide answer in this structure:
    - Summary of Findings
    - Relevant Sections
    - Clinical Significance`;

    return await analyzeTextWithAI(fullPrompt);
  } catch (error) {
    console.error('Chat workflow error:', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    throw new Error('Drug Q&A service is temporarily unavailable');
  }
}

//==
export async function autoCompleteDrugs(prefix: string): Promise<string[]> {
  // GET /api/drugs/autocomplete?prefix=xxx
  const response = await axios.get<string[]>(`${API_BASE}/drugs/autocomplete`, {
    params: { prefix },
  });
  return response.data; 
}