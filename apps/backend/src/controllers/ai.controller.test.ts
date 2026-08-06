import { Request, Response, NextFunction } from 'express';
import {
  getTypingFeedback,
  generateWritingPrompt,
  getWritingFeedback,
  getStoryResponse,
} from './ai.controller';
import { AppError } from '../middleware/error-handler';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AIController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'mock-api-key';
  });

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    originalFetch = global.fetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getTypingFeedback', () => {
    it('should generate typing feedback for valid metrics', async () => {
      mockRequest = {
        body: {
          wpm: 60,
          accuracy: 95,
          errors: 3,
          duration: 30,
        },
      };

      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Great job typing! Keep it up!',
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGeminiResponse),
      } as unknown as Response);

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Great job typing! Keep it up!',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should trigger validation error if required metrics are missing', async () => {
      mockRequest = {
        body: {
          errors: 3,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should trigger validation error if accuracy is out of range', async () => {
      mockRequest = {
        body: {
          wpm: 60,
          accuracy: 105, // invalid (>100)
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should trigger validation error if wpm is negative', async () => {
      mockRequest = {
        body: {
          wpm: -10,
          accuracy: 90,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should trigger validation error if wpm is too high (overflow attempt)', async () => {
      mockRequest = {
        body: {
          wpm: 2000, // max is 1000
          accuracy: 90,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('generateWritingPrompt', () => {
    it('should generate writing prompt successfully', async () => {
      mockRequest = {};

      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Write about a magical cat.',
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGeminiResponse),
      } as unknown as Response);

      await generateWritingPrompt(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        prompt: 'Write about a magical cat.',
      });
    });

    it('should handle API errors by passing 502/AppError to next', async () => {
      mockRequest = {};

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({ error: 'Some error' }),
      } as unknown as Response);

      await generateWritingPrompt(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('getWritingFeedback', () => {
    it('should generate writing feedback for valid prompt text', async () => {
      mockRequest = {
        body: {
          text: 'This is a sample story I wrote.',
          type: 'story-chain',
        },
      };

      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'Good sentence structure.',
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGeminiResponse),
      } as unknown as Response);

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Good sentence structure.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should trigger validation error if text is too long', async () => {
      mockRequest = {
        body: {
          text: 'a'.repeat(5001), // limit is 5000
        },
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should trigger validation error if text is empty', async () => {
      mockRequest = {
        body: {
          text: '',
        },
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getStoryResponse', () => {
    it('should generate cooperative story response for valid story array', async () => {
      mockRequest = {
        body: {
          story: ['Once upon a time', 'A brave knight appeared'],
        },
      };

      const mockGeminiResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: 'He fought the dragon bravely.',
                },
              ],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGeminiResponse),
      } as unknown as Response);

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        response: 'He fought the dragon bravely.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should trigger validation error if story is empty', async () => {
      mockRequest = {
        body: {
          story: [],
        },
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should trigger validation error if story has too many paragraphs', async () => {
      mockRequest = {
        body: {
          story: Array(21).fill('A short paragraph'), // limit is 20
        },
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should trigger validation error if story paragraph exceeds character limit', async () => {
      mockRequest = {
        body: {
          story: ['a'.repeat(1001)], // limit is 1000
        },
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
