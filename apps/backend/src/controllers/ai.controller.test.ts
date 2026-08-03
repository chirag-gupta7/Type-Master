import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  getTypingFeedback,
  generateWritingPrompt,
  getWritingFeedback,
  getStoryResponse,
} from './ai.controller';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AI Controller Unit Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let originalFetch: typeof fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {};
    jest.clearAllMocks();

    // Mock global.fetch
    global.fetch = jest.fn().mockResolvedValue({
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
    } as unknown as Response) as unknown as typeof fetch;
  });

  describe('getTypingFeedback', () => {
    it('should successfully call callGemini and return feedback for valid input', async () => {
      mockRequest.body = {
        wpm: 65,
        accuracy: 98.5,
        errors: 3,
        duration: 60,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Mocked AI Response' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail with Zod validation error if wpm is negative', async () => {
      mockRequest.body = {
        wpm: -5,
        accuracy: 98.5,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should fail with Zod validation error if accuracy is greater than 100', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 105,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail if required fields are missing', async () => {
      mockRequest.body = {
        wpm: 60,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getWritingFeedback', () => {
    it('should successfully get writing feedback for valid input', async () => {
      mockRequest.body = {
        text: 'This is a sample text for the typing game creative mode.',
        type: 'prompt-dash',
        priorFeedback: null,
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Mocked AI Response' });
    });

    it('should fail with Zod error if text is empty or missing', async () => {
      mockRequest.body = {
        type: 'prompt-dash',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail with Zod error if text is too long (over 2000 chars)', async () => {
      mockRequest.body = {
        text: 'a'.repeat(2001),
        type: 'story-chain',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail with Zod error if type is invalid', async () => {
      mockRequest.body = {
        text: 'Hello world',
        type: 'invalid-type',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getStoryResponse', () => {
    it('should successfully get story response for valid input', async () => {
      mockRequest.body = {
        story: ['Once upon a time', 'There was a tiny mouse'],
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ response: 'Mocked AI Response' });
    });

    it('should fail with Zod error if story is empty', async () => {
      mockRequest.body = {
        story: [],
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail if story has too many entries', async () => {
      mockRequest.body = {
        story: Array(51).fill('A sentence.'),
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail if any story entry is too long', async () => {
      mockRequest.body = {
        story: ['Valid sentence', 'b'.repeat(1001)],
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('generateWritingPrompt', () => {
    it('should successfully get writing prompt', async () => {
      await generateWritingPrompt(mockRequest as Request, mockResponse as Response, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ prompt: 'Mocked AI Response' });
    });
  });
});
