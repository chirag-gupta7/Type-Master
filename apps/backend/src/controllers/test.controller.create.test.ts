import { Request, Response, NextFunction } from 'express';
import { createTestResult } from './test.controller';
import { prisma } from '../utils/prisma';
import { awardAchievementsForUser } from './achievement.controller';

jest.mock('../utils/prisma', () => ({
  prisma: { testResult: { create: jest.fn() } },
}));

jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock('./achievement.controller', () => ({
  awardAchievementsForUser: jest.fn().mockResolvedValue([]),
}));

const mockedAward = awardAchievementsForUser as jest.Mock;

describe('TestController - createTestResult', () => {
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let nextMock: jest.Mock;
  let req: any;
  let res: any;

  const validBody = { wpm: 80, accuracy: 97, rawWpm: 85, errors: 3, duration: '60', mode: 'WORDS' };

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    nextMock = jest.fn();
    req = { user: { userId: 'user-123', email: 'u@e.c' }, body: { ...validBody } };
    res = { json: jsonMock, status: statusMock };
    jest.clearAllMocks();
    mockedAward.mockResolvedValue([]);
  });

  it('creates test result and returns 201 on happy path', async () => {
    (prisma.testResult.create as jest.Mock).mockResolvedValue({ id: 't1', ...validBody, userId: 'user-123' });
    await createTestResult(req as Request, res as Response, nextMock as NextFunction);
    expect(prisma.testResult.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'user-123', wpm: 80 }) })
    );
    expect(mockedAward).toHaveBeenCalledWith('user-123');
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.any(String), testResult: expect.any(Object) })
    );
  });

  it('returns 401 when unauthenticated', async () => {
    req.user = undefined;
    await createTestResult(req as Request, res as Response, nextMock as NextFunction);
    expect(nextMock).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
    expect(prisma.testResult.create).not.toHaveBeenCalled();
  });

  it('forwards 400/ZodError on invalid input', async () => {
    req.body = { wpm: -1, accuracy: 500, rawWpm: -2, errors: -1, duration: 'nope' };
    await createTestResult(req as Request, res as Response, nextMock as NextFunction);
    expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
    expect((nextMock.mock.calls[0][0] as Error).name).toBe('ZodError');
  });

  it('still returns 201 when auto-award fails (fire-and-forget)', async () => {
    (prisma.testResult.create as jest.Mock).mockResolvedValue({ id: 't1' });
    mockedAward.mockRejectedValue(new Error('award down'));
    await createTestResult(req as Request, res as Response, nextMock as NextFunction);
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(nextMock).not.toHaveBeenCalled();
  });

  it('forwards db errors to next (500 path)', async () => {
    (prisma.testResult.create as jest.Mock).mockRejectedValue(new Error('db down'));
    await createTestResult(req as Request, res as Response, nextMock as NextFunction);
    expect(nextMock).toHaveBeenCalledWith(expect.any(Error));
  });
});
