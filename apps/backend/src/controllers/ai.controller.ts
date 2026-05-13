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

/**
 * Generate a new creative writing prompt
 */
export const generateWritingPrompt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const systemPrompt = 'Generate a single creative writing prompt for a typing speed game.';
    const userQuery = 'The prompt should be engaging, imaginative, and inspire creative writing. It should be 1-2 sentences long. Examples: "Describe a city hidden in the clouds." or "The ancient artifact began to glow..." Return ONLY the prompt text, nothing else.';

    const prompt = await callGemini(systemPrompt, userQuery, 100, 0.9);
    res.json({ prompt });
  } catch (error) {
    next(error);
  }
};

/**
 * Get feedback for creative writing (Prompt Dash or Story Chain)
 */
export const getWritingFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, type, priorFeedback } = req.body;

    if (!text) {
      throw new AppError(400, 'No text provided for analysis');
    }

    let systemPrompt = '';
    if (type === 'story-chain') {
      systemPrompt = `You are a collaborative storytelling coach analyzing a user's contributions in a game called Story Chain. Highlight the user's narrative voice, pacing, tone, and how well they build on prior sentences. If you are given earlier feedback that you provided, compare the new writing with that guidance and highlight any progress or areas that still need work.`;
    } else {
      systemPrompt = `You are a supportive creative-writing coach for a typing practice game. Offer precise, encouraging feedback (2-3 sentences) about the user's writing style, tone, vocabulary, and clarity. If prior feedback is provided, compare the current writing to that guidance and highlight any progress or areas that still need work.`;
    }

    const userQuery = priorFeedback
      ? `Previous feedback: ${priorFeedback}\n\nCurrent writing: ${text}\n\nProvide updated feedback referencing progress.`
      : `Current writing: ${text}\n\nProvide fresh feedback focused on style and clarity.`;

    const feedback = await callGemini(systemPrompt, userQuery, 250, 0.7);
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the next sentence in a collaborative story
 */
export const getStoryResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { story } = req.body; // Array of sentences
    const isFirstSentence = !story || story.length === 0;

    const systemPrompt = isFirstSentence
      ? 'You are starting a collaborative story in a typing game. Generate an engaging opening sentence that sets up an interesting scenario or mystery. Keep it to a single, concise sentence. Do not add any preamble. Just write the sentence.'
      : `You are a creative and engaging storyteller collaborating with a user in a typing game called Story Chain. The user provides a sentence, and your task is to write the *very next* sentence to continue the narrative smoothly and interestingly. Focus on building upon the user's last sentence. Be imaginative but keep the story coherent. IMPORTANT: Your response MUST be only a single sentence. Do NOT add any introductory phrases. Just provide the next sentence directly.`;

    const userQuery = isFirstSentence
      ? 'Write an engaging opening sentence for a story.'
      : `Story so far:\n${story.join('\n')}\n\nWrite the next single sentence.`;

    const response = await callGemini(systemPrompt, userQuery, 150, 0.8);
    res.json({ response });
  } catch (error) {
    next(error);
  }
};

// Compatibility exports for main branch changes
export const getAiFeedback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { systemPrompt, userQuery, generationConfig } = req.body;
    const text = await callGemini(systemPrompt, userQuery, generationConfig?.maxOutputTokens, generationConfig?.temperature);
    res.json({ text });
  } catch (error) {
    next(error);
  }
};

export const generateAiContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt, generationConfig } = req.body;
    const text = await callGemini('', prompt, generationConfig?.maxOutputTokens, generationConfig?.temperature);
    res.json({ text });
  } catch (error) {
    next(error);
  }
};
