import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

/**
 * Generic helper to call Gemini API
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

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  const data = (await response.json()) as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

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

export const generateAiContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, generationConfig } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      logger.error('GEMINI_API_KEY is not set in backend environment');
      throw new AppError(500, 'AI Service unavailable');
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: generationConfig || {
          temperature: 0.9,
          maxOutputTokens: 200,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Gemini API error', { errorData });
      throw new AppError(502, 'Failed to generate AI content');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    res.json({ text });
  } catch (error) {
    next(error);
  }
};
