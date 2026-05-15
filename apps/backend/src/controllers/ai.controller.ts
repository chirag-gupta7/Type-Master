import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const extractGeminiText = (data: GeminiResponse): string | null => {
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
};

/**
 * Generic helper to call Gemini API
 * Securely uses x-goog-api-key header instead of query parameters
 */
const callGemini = async (
  systemPrompt: string,
  userQuery: string,
  maxTokens: number = 250,
  temperature: number = 0.7
) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    logger.error('GEMINI_API_KEY is not set in backend environment');
    throw new AppError(500, 'AI Service unavailable');
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${userQuery}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    logger.error('Gemini API error', { errorData });
    throw new AppError(502, 'AI service currently unavailable');
  }

  const data = (await response.json()) as GeminiResponse;
  const text = extractGeminiText(data);

  if (!text) {
    throw new AppError(502, 'AI service failed to generate a response');
  }

  return text;
};

/**
 * Get feedback for a standard typing test
 */
export const getTypingFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { wpm, accuracy, errors, duration } = req.body;

    if (wpm === undefined || accuracy === undefined) {
      throw new AppError(400, 'Missing required performance metrics');
    }

    const systemPrompt = "You are a typing tutor AI. Analyze the user's typing test results (WPM, accuracy) and provide concise, helpful feedback (2-3 sentences max). Focus on constructive advice based on their performance (e.g., focus on accuracy if low, practice for speed if accuracy is high but WPM low). Be encouraging.";
    const userQuery = `Analyze typing test results:\nWPM: ${wpm}\nAccuracy: ${accuracy}%\nErrors: ${errors}\nDuration: ${duration} seconds\n\nProvide helpful feedback.`;

    const feedback = await callGemini(systemPrompt, userQuery);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

export const generateWritingPrompt = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const prompt = await callGemini(
      'You are a creative writing assistant for typing games. Return exactly one short writing prompt (1-2 sentences). Keep it engaging and suitable for general audiences.',
      'Generate one fresh writing prompt for a typing game.',
      120,
      0.9
    );
    res.json({ prompt });
  } catch (error) {
    next(error);
  }
};

export const getWritingFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, type, priorFeedback } = req.body as {
      text?: string;
      type?: 'prompt-dash' | 'story-chain';
      priorFeedback?: string | null;
    };

    if (!text || !text.trim()) {
      throw new AppError(400, 'Text is required');
    }

    const mode = type === 'story-chain' ? 'story-chain' : 'prompt-dash';
    const systemPrompt = `You are a writing coach for a typing game. Give concise, constructive feedback in 2-4 sentences. Focus on clarity, grammar, and creativity. This text is from ${mode}.`;
    const userQuery = priorFeedback
      ? `Text:\n${text}\n\nPrevious feedback:\n${priorFeedback}\n\nProvide improved, non-repetitive feedback.`
      : `Text:\n${text}\n\nProvide feedback.`;

    const feedback = await callGemini(systemPrompt, userQuery, 220, 0.7);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

export const getStoryResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body as { story?: string[] };
    if (!Array.isArray(story) || story.length === 0) {
      throw new AppError(400, 'Story history is required');
    }

    const storyContext = story.join('\n');
    const response = await callGemini(
      'You are playing a collaborative story game. Continue the story with one short paragraph (2-4 sentences). Keep tone consistent and avoid explicit content.',
      `Continue this story:\n${storyContext}`,
      180,
      0.9
    );

    res.json({ response });
  } catch (error) {
    next(error);
  }
};

/**
 * Compatibility handler for main branch AI feedback calls
 */
export const getAiFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemPrompt, userQuery, generationConfig } = req.body as {
      systemPrompt?: string;
      userQuery?: string;
      generationConfig?: {
        temperature?: number;
        maxOutputTokens?: number;
      };
    };

    if (!systemPrompt || !userQuery) {
      throw new AppError(400, 'systemPrompt and userQuery are required');
    }

    const text = await callGemini(
      systemPrompt,
      userQuery,
      generationConfig?.maxOutputTokens ?? 250,
      generationConfig?.temperature ?? 0.7
    );
    res.json({ text });
  } catch (error) {
    next(error);
  }
};

/**
 * Compatibility handler for direct AI content generation
 */
export const generateAiContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, generationConfig } = req.body;

    // Use callGemini to benefit from its secure header implementation and validation
    const text = await callGemini(
      'Generate content based on the following prompt.',
      prompt,
      generationConfig?.maxOutputTokens ?? 200,
      generationConfig?.temperature ?? 0.9
    );

    res.json({ text });
  } catch (error) {
    next(error);
  }
};
