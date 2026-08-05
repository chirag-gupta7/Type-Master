import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  getTypingFeedback,
  getWritingFeedback,
  getStoryResponse,
} from './ai.controller';

// Save the original fetch to restore after tests
const originalFetch = global.fetch;

describe('AIController - Input Validation and Security Enhancements', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      body: {},
    };
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    process.env.GEMINI_API_KEY = 'test-api-key';
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  });

  const mockGeminiSuccess = (text: string) => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
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
    it('should successfully generate feedback for a valid payload', async () => {
      mockRequest.body = {
        wpm: 65,
        accuracy: 98,
        errors: 3,
        duration: 60,
      };

      mockGeminiSuccess('Great typing performance!');

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Great typing performance!' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation if WPM is missing', async () => {
      mockRequest.body = {
        accuracy: 98,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if WPM is negative', async () => {
      mockRequest.body = {
        wpm: -5,
        accuracy: 98,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if WPM exceeds 300 (abnormal/tampered)', async () => {
      mockRequest.body = {
        wpm: 350,
        accuracy: 98,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if accuracy is greater than 100', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 101,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if errors is negative', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 95,
        errors: -1,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if duration is over 3600 seconds (1 hour)', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 95,
        duration: 3601,
      };

      await getTypingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getWritingFeedback', () => {
    it('should successfully generate feedback for a valid writing feedback request', async () => {
      mockRequest.body = {
        text: 'This is some typing exercise content that I am writing.',
        type: 'prompt-dash',
        priorFeedback: 'Good flow, keep it up.',
      };

      mockGeminiSuccess('Excellent composition!');

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(jsonMock).toHaveBeenCalledWith({ feedback: 'Excellent composition!' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation if text is missing', async () => {
      mockRequest.body = {
        type: 'prompt-dash',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if text is empty', async () => {
      mockRequest.body = {
        text: '',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if text length is greater than 2000 characters', async () => {
      mockRequest.body = {
        text: 'a'.repeat(2001),
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if priorFeedback exceeds 1000 characters', async () => {
      mockRequest.body = {
        text: 'Some story text.',
        priorFeedback: 'b'.repeat(1001),
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if type is an invalid mode', async () => {
      mockRequest.body = {
        text: 'Some story text.',
        type: 'invalid-mode',
      };

      await getWritingFeedback(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('getStoryResponse', () => {
    it('should successfully generate a story response with valid story array', async () => {
      mockRequest.body = {
        story: ['Once upon a time, there was a developer.', 'The developer loved writing clean code.'],
      };

      mockGeminiSuccess('And then, the developer found a bug.');

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(jsonMock).toHaveBeenCalledWith({ response: 'And then, the developer found a bug.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should fail validation if story array is missing', async () => {
      mockRequest.body = {};

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if story array is empty', async () => {
      mockRequest.body = {
        story: [],
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if story array has too many segments (over 20)', async () => {
      mockRequest.body = {
        story: Array(21).fill('A short sentence.'),
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should fail validation if any story segment exceeds 500 characters', async () => {
      mockRequest.body = {
        story: ['Start of the story.', 'c'.repeat(501)],
      };

      await getStoryResponse(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });
});
