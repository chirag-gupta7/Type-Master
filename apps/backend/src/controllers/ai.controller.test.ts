import { getTypingFeedback, getWritingFeedback, getStoryResponse } from './ai.controller';

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AIController Input Validation', () => {
  let mockRequest: any;
  let mockResponse: any;
  let nextMock: jest.Mock;
  let jsonMock: jest.Mock;
  let originalFetch: any;

  beforeAll(() => {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    originalFetch = global.fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jsonMock = jest.fn();
    mockResponse = {
      json: jsonMock,
    };
    nextMock = jest.fn();
    mockRequest = {
      body: {},
    };
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Mock feedback response from tutor.' }],
                },
              },
            ],
          }),
      } as any)
    );
    jest.clearAllMocks();
  });

  describe('getTypingFeedback', () => {
    it('should successfully generate feedback for valid inputs', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 95,
        errors: 3,
        duration: 30,
      };

      await getTypingFeedback(mockRequest, mockResponse, nextMock);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Mock feedback response from tutor.',
      });
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should fail validation when wpm is negative', async () => {
      mockRequest.body = {
        wpm: -10,
        accuracy: 95,
      };

      await getTypingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should fail validation when wpm is too high', async () => {
      mockRequest.body = {
        wpm: 350,
        accuracy: 95,
      };

      await getTypingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation when accuracy is out of bounds (105)', async () => {
      mockRequest.body = {
        wpm: 60,
        accuracy: 105,
      };

      await getTypingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getWritingFeedback', () => {
    it('should successfully get writing feedback for valid inputs', async () => {
      mockRequest.body = {
        text: 'This is a beautifully typed creative sentence.',
        type: 'prompt-dash',
        priorFeedback: 'Prior tutor comments.',
      };

      await getWritingFeedback(mockRequest, mockResponse, nextMock);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        feedback: 'Mock feedback response from tutor.',
      });
    });

    it('should fail validation when text is empty', async () => {
      mockRequest.body = {
        text: '',
      };

      await getWritingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation when text exceeds 1000 characters to prevent high-cost abuse', async () => {
      mockRequest.body = {
        text: 'a'.repeat(1001),
      };

      await getWritingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation with invalid enum type', async () => {
      mockRequest.body = {
        text: 'Valid typed text.',
        type: 'invalid-mode',
      };

      await getWritingFeedback(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getStoryResponse', () => {
    it('should successfully get story continuation for valid story list', async () => {
      mockRequest.body = {
        story: ['Once upon a time in a digital land', 'There was a swift typist.'],
      };

      await getStoryResponse(mockRequest, mockResponse, nextMock);

      expect(global.fetch).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({
        response: 'Mock feedback response from tutor.',
      });
    });

    it('should fail validation when story array is empty', async () => {
      mockRequest.body = {
        story: [],
      };

      await getStoryResponse(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation when story array exceeds 20 elements', async () => {
      mockRequest.body = {
        story: Array(21).fill('A short story line.'),
      };

      await getStoryResponse(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation if any story part is too long', async () => {
      mockRequest.body = {
        story: ['a'.repeat(501)],
      };

      await getStoryResponse(mockRequest, mockResponse, nextMock);

      expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
