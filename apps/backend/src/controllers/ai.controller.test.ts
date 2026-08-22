import { Request, Response, NextFunction } from 'express';
import {
  getTypingFeedback,
  getWritingFeedback,
  getStoryResponse,
  generateWritingPrompt,
} from './ai.controller';
import { ZodError } from 'zod';
import { AppError } from '../middleware/error-handler';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AI Controller Unit Tests', () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'mocked-api-key';
  });

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    } as unknown as Response;
    mockNext = jest.fn();
    mockRequest = {
      body: {},
    } as unknown as Request;
    jest.clearAllMocks();

    // Mock global fetch
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Mocked AI Response',
                    },
                  ],
                },
              },
            ],
          }),
      })
    ) as unknown as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getTypingFeedback', () => {
    it('should successfully generate typing feedback with valid input', async () => {
      mockRequest.body = {
        wpm: 80,
        accuracy: 95,
        errors: 3,
        duration: 60,
      };

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Mocked AI Response' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-numeric/negative/invalid values', async () => {
      mockRequest.body = {
        wpm: -10, // Invalid: negative
        accuracy: 105, // Invalid: > 100
        errors: 'five', // Invalid: not a number
        duration: 0, // Invalid: <= 0
      };

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject missing values', async () => {
      mockRequest.body = {
        wpm: 80,
      };

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject wpm that exceeds the max limit', async () => {
      mockRequest.body = {
        wpm: 2000, // Invalid: > 1000
        accuracy: 90,
        errors: 5,
        duration: 30,
      };

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getWritingFeedback', () => {
    it('should successfully generate writing feedback with valid input', async () => {
      mockRequest.body = {
        text: 'This is a beautiful sentence to practice typing.',
        type: 'prompt-dash',
      };

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Mocked AI Response' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty or missing text', async () => {
      mockRequest.body = {
        text: '',
        type: 'prompt-dash',
      };

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should reject text exceeding max length', async () => {
      mockRequest.body = {
        text: 'A'.repeat(2001), // Max limit is 2000
        type: 'prompt-dash',
      };

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should reject invalid enum type', async () => {
      mockRequest.body = {
        text: 'A sentence',
        type: 'invalid-type',
      };

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getStoryResponse', () => {
    it('should successfully get story response with valid story array', async () => {
      mockRequest.body = {
        story: ['Once upon a time', 'there was a clever developer.'],
      };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ response: 'Mocked AI Response' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject empty story array', async () => {
      mockRequest.body = {
        story: [],
      };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should reject array containing empty strings', async () => {
      mockRequest.body = {
        story: [''],
      };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should reject array with too many segments', async () => {
      mockRequest.body = {
        story: Array(51).fill('A sentence.'), // limit is 50
      };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should reject if some story parts exceed max length limit', async () => {
      mockRequest.body = {
        story: ['Short story part', 'B'.repeat(1001)], // max limit 1000
      };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('generateWritingPrompt', () => {
    it('should generate a writing prompt without inputs', async () => {
      await generateWritingPrompt(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ prompt: 'Mocked AI Response' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('external AI call request timeout', () => {
    it('should return 504 AppError when the Gemini request aborts (timeout)', async () => {
      mockRequest.body = { wpm: 60, accuracy: 95, errors: 2, duration: 60 };

      const abortError = new Error('The operation was aborted.');
      abortError.name = 'AbortError';
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(504);
      expect(error.message).toContain('AI service request timed out');
    });
  });
});
