import { startAssessment } from './assessment.controller';
import { prisma } from '../utils/prisma';

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    lesson: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock Logger
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('AssessmentController - startAssessment', () => {
  let mockRequest: any;
  let mockResponse: any;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    mockResponse = {
      json: jsonMock,
      status: statusMock,
    };
    mockRequest = {
      userId: 'user-123',
      body: {},
    };
    jest.clearAllMocks();
  });

  it('should return 401 if authUserId is missing', async () => {
    mockRequest.userId = undefined;
    await startAssessment(mockRequest, mockResponse);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });

  it('should return 403 if bodyUserId does not match authUserId', async () => {
    mockRequest.body = { userId: 'different-user' };
    await startAssessment(mockRequest, mockResponse);
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Forbidden' });
  });

  it('should return 404 if user is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
      content: 'Hello World',
      targetWpm: 40,
      minAccuracy: 95,
    });

    await startAssessment(mockRequest, mockResponse);
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('should return 500 if assessment lesson is not found', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
    (prisma.lesson.findFirst as jest.Mock).mockResolvedValue(null);

    await startAssessment(mockRequest, mockResponse);
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Assessment content not found' });
  });

  it('should return 200 with lesson details when assessment starts successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' });
    (prisma.lesson.findFirst as jest.Mock).mockResolvedValue({
      content: 'Hello World',
      targetWpm: 40,
      minAccuracy: 95,
    });

    await startAssessment(mockRequest, mockResponse);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Assessment started',
        content: 'Hello World',
        targetWpm: 40,
        minAccuracy: 95,
      })
    );
  });
});
