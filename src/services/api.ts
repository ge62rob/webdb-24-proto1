import axios from 'axios';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const FDA_API_BASE_URL = 'https://api.fda.gov/drug/label.json';
const MAX_TOKEN_LIMIT = 2000; // Token limit for each chunk
const SUMMARY_TOKEN_LIMIT = 1500; // Token limit for each summary

/**
 * Fetch drug data from the FDA API using the brand name.
 * @param brandName The brand name of the drug.
 * @returns A Promise that resolves to an array of Drug objects.
 */
export async function fetchDrugData(brandName: string): Promise<any[]> {
  try {
    const response = await axios.get(FDA_API_BASE_URL, {
      params: {
        search: `openfda.brand_name:"${brandName}"`,
        limit: 1,
      },
    });

    const results = response.data.results;

    if (!results || results.length === 0) {
      throw new Error('No data found for the specified drug.');
    }

    return results.map((item: any) => ({
      id: item.id,
      name: item.openfda.brand_name[0],
      category: item.openfda.product_type?.[0] || 'Not specified',
      indications: item.indications_and_usage ? [item.indications_and_usage] : [],
      warnings: item.warnings ? [item.warnings] : [],
      mechanismOfAction: item.clinical_pharmacology || 'Information not available',
      dosage: item.dosage_and_administration || 'Dosage information not available',
      contraindications: item.contraindications ? [item.contraindications] : [],
    }));
  } catch (error) {
    console.error('Error fetching drug data:', error);
    throw new Error('Failed to fetch drug data. Please try again.');
  }
}

/**
 * Analyze potential cross-reactions between drugs using OpenAI API.
 * @param drugs An array of drug names.
 * @returns A Promise that resolves to a string containing the analysis.
 */
export async function analyzeDrugInteractions(drugs: string[]): Promise<string> {
  try {
    const prompt = `Analyze the following drugs for potential interactions or cross-reactions: ${drugs.join(', ')}. Provide recommendations for safety and highlight any contraindications.`;

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error analyzing drug interactions:', error.response?.data || error.message);
    throw new Error('Failed to analyze drug interactions. Please try again.');
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
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing text:', error.response?.data || error.message);
    throw new Error('Failed to summarize text. Please try again.');
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
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.5,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
      }
    );

    return [response.data.choices[0].message.content.trim()];
  } catch (error) {
    console.error('Error condensing summaries:', error.response?.data || error.message);
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
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: SUMMARY_TOKEN_LIMIT,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating answer:', error.response?.data || error.message);
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
    console.error('Error in chatWithProspectus:', error.response?.data || error.message);
    throw new Error('Failed to chat with the prospectus. Please try again.');
  }
}
