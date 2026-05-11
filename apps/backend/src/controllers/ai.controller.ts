import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error-handler';
import { logger } from '../utils/logger';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export const getAiFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemPrompt, userQuery, generationConfig } = req.body;
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
        generationConfig: generationConfig || {
          temperature: 0.7,
          maxOutputTokens: 250,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Gemini API error', { errorData });
      throw new AppError(502, 'Failed to get AI feedback');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    res.json({ text });
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
