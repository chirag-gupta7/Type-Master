import {
  getTypingFeedback,
  generateWritingPrompt,
  getWritingFeedback,
  getStoryResponse,
} from './ai.controller';
import { AppError } from '../middleware/error-handler';

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AIController', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      body: {},
    };
    mockNext = jest.fn();
    global.fetch = jest.fn();
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  describe('getTypingFeedback', () => {
    it('should return feedback successfully', async () => {
      mockRequest.body = { wpm: 60, accuracy: 95, errors: 2, duration: 60 };

      const mockResponseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Great typing speed and accuracy!' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Great typing speed and accuracy!',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should pass error to next if missing metrics', async () => {
      mockRequest.body = { wpm: 60 }; // missing accuracy

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('Missing required performance metrics');
    });

    it('should throw 504 on AbortError (timeout)', async () => {
      mockRequest.body = { wpm: 60, accuracy: 95, errors: 2, duration: 60 };

      const abortError = new Error('The user aborted a request.');
      abortError.name = 'AbortError';

      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await getTypingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(504);
      expect(error.message).toContain('AI service request timed out');
    });
  });

  describe('generateWritingPrompt', () => {
    it('should generate a prompt successfully', async () => {
      const mockResponseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Write about a flying car.' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      await generateWritingPrompt(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        prompt: 'Write about a flying car.',
      });
    });
  });

  describe('getWritingFeedback', () => {
    it('should return writing feedback successfully', async () => {
      mockRequest.body = { text: 'Some user text' };

      const mockResponseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Your writing is clear.' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Your writing is clear.',
      });
    });

    it('should fail if text is empty', async () => {
      mockRequest.body = { text: '' };

      await getWritingFeedback(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });

  describe('getStoryResponse', () => {
    it('should continue the story successfully', async () => {
      mockRequest.body = { story: ['Once upon a time', 'there was a typist'] };

      const mockResponseData = {
        candidates: [
          {
            content: {
              parts: [{ text: 'Who typed super fast.' }],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponseData),
      });

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        response: 'Who typed super fast.',
      });
    });

    it('should fail if story is missing or empty', async () => {
      mockRequest.body = { story: [] };

      await getStoryResponse(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toBe(400);
    });
  });
});
