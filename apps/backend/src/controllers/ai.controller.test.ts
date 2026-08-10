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
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn() as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  const mockGeminiSuccess = (text: string) => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text }],
            },
          },
        ],
      }),
    });
  };

  describe('getTypingFeedback', () => {
    it('should successfully return feedback for valid performance metrics', async () => {
      mockRequest = {
        body: {
          wpm: 65,
          accuracy: 98,
          errors: 3,
          duration: 30,
        },
      };

      mockGeminiSuccess('Great typing performance!');

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-goog-api-key': 'test-api-key',
          }),
        })
      );
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Great typing performance!' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with ZodError if wpm is out of range', async () => {
      mockRequest = {
        body: {
          wpm: 450, // above 300
          accuracy: 98,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      // Verify it's a Zod validation error
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.name).toBe('ZodError');
    });

    it('should fail with ZodError if accuracy is missing', async () => {
      mockRequest = {
        body: {
          wpm: 65,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.name).toBe('ZodError');
    });
  });

  describe('generateWritingPrompt', () => {
    it('should successfully return a writing prompt', async () => {
      mockRequest = {};
      mockGeminiSuccess('The quick brown fox jumps over the lazy dog.');

      await generateWritingPrompt(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        prompt: 'The quick brown fox jumps over the lazy dog.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('getWritingFeedback', () => {
    it('should successfully return feedback for valid text', async () => {
      mockRequest = {
        body: {
          text: 'This is some text that I typed.',
          type: 'prompt-dash',
          priorFeedback: null,
        },
      };

      mockGeminiSuccess('Constructive feedback on writing style.');

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Constructive feedback on writing style.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with ZodError if text is too long', async () => {
      mockRequest = {
        body: {
          text: 'a'.repeat(1001), // over 1000 characters
        },
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.name).toBe('ZodError');
    });
  });

  describe('getStoryResponse', () => {
    it('should successfully return a story continuation', async () => {
      mockRequest = {
        body: {
          story: ['Once upon a time', 'There was a tiny mouse'],
        },
      };

      mockGeminiSuccess('And then the mouse found a giant piece of cheese.');

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(jsonMock).toHaveBeenCalledWith({
        response: 'And then the mouse found a giant piece of cheese.',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with ZodError if story is empty', async () => {
      mockRequest = {
        body: {
          story: [],
        },
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.name).toBe('ZodError');
    });

    it('should fail with ZodError if a story segment is too long', async () => {
      mockRequest = {
        body: {
          story: ['Once upon a time', 'a'.repeat(1001)],
        },
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.name).toBe('ZodError');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should throw 500 AppError if GEMINI_API_KEY is not defined', async () => {
      delete process.env.GEMINI_API_KEY;

      mockRequest = {
        body: {
          wpm: 60,
          accuracy: 95,
        },
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.statusCode).toBe(500);
      expect(errorArg.message).toBe('AI Service unavailable');
    });

    it('should throw 502 AppError if Gemini API fails', async () => {
      mockRequest = {
        body: {
          wpm: 60,
          accuracy: 95,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.statusCode).toBe(502);
      expect(errorArg.message).toBe('AI service currently unavailable');
    });

    it('should throw 502 AppError if response does not contain parts text', async () => {
      mockRequest = {
        body: {
          wpm: 60,
          accuracy: 95,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [], // missing content
        }),
      });

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const errorArg = (mockNext as jest.Mock).mock.calls[0][0];
      expect(errorArg.statusCode).toBe(502);
      expect(errorArg.message).toBe('AI service failed to generate a response');
    });
  });
});
