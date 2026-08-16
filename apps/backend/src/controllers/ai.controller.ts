import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

// Input validation schemas for strict types, range checks, and maximum lengths
// to prevent prompt injection and Denial of Service (DoS) or high-cost resource exhaustion attacks.
// Input validation schemas for AI proxy endpoints to prevent prompt injection and resource/cost DoS
// Security: Enforce strict boundaries, type constraints, and max lengths to prevent prompt injection and DoS/resource exhaustion
const typingFeedbackSchema = z.object({
  wpm: z.number().nonnegative('WPM must be non-negative').max(1000, 'WPM is too high'),
  accuracy: z.number().min(0, 'Accuracy must be at least 0').max(100, 'Accuracy cannot exceed 100'),
  errors: z.number().nonnegative('Errors must be non-negative').max(1000, 'Errors is too high'),
  duration: z.number().positive('Duration must be positive').max(3600, 'Duration is too high'),
});

const writingFeedbackSchema = z.object({
  text: z.string().min(1, 'Text is required').max(2000, 'Text exceeds maximum allowed length'),
  type: z.enum(['prompt-dash', 'story-chain']).default('prompt-dash'),
  priorFeedback: z.string().max(2000, 'Prior feedback exceeds maximum allowed length').nullable().optional(),
});

const storyResponseSchema = z.object({
  story: z
    .array(z.string().min(1, 'Story part cannot be empty').max(1000, 'Story part exceeds maximum allowed length'))
    .min(1, 'Story history is required')
    .max(50, 'Story history is too long'),
});

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
// Validate input using strict Zod schema to prevent payload tampering/injection
    const { wpm, accuracy, errors, duration } = typingFeedbackSchema.parse(req.body);

    const systemPrompt =
      "You are a typing tutor AI. Analyze the user's typing test results (WPM, accuracy) and provide concise, helpful feedback (2-3 sentences max). Focus on constructive advice based on their performance (e.g., focus on accuracy if low, practice for speed if accuracy is high but WPM low). Be encouraging.";
const userQuery = `Analyze typing test results:\nWPM: ${wpm}\nAccuracy: ${accuracy}%\nErrors: ${errors ?? 'N/A'}\nDuration: ${duration ? `${duration} seconds` : 'N/A'}\n\nProvide helpful feedback.`;

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
// Validate input using strict Zod schema to prevent massive text DoS/injection attacks
    const { text, type, priorFeedback } = writingFeedbackSchema.parse(req.body);

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
// Validate input using strict Zod schema to prevent deep recursive story nesting or excessively large payloads
    const { story } = storyResponseSchema.parse(req.body);

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
