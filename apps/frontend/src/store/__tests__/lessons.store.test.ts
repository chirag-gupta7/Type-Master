jest.mock('@/lib/api', () => ({
  lessonAPI: { getAllLessons: jest.fn() },
}));

import { lessonAPI } from '@/lib/api';
import { useLessonsStore } from '../lessons.store';

const mockedGetAll = lessonAPI.getAllLessons as jest.Mock;

const lesson = (id: string) => ({
  id,
  level: 1,
  order: 1,
  title: `T ${id}`,
  description: 'd',
  keys: ['A'],
  difficulty: 'Beginner',
  targetWpm: 20,
  minAccuracy: 90,
  exerciseType: 'guided',
  content: 'aaa',
  section: 1,
  isCheckpoint: false,
});

const reset = () =>
  useLessonsStore.setState({ lessons: new Map(), loaded: false, loading: false });

beforeEach(() => {
  reset();
  mockedGetAll.mockReset();
});

describe('lessons.store', () => {
  it('starts empty and unloaded', () => {
    const s = useLessonsStore.getState();
    expect(s.lessons.size).toBe(0);
    expect(s.loaded).toBe(false);
    expect(s.loading).toBe(false);
    expect(s.getLesson('x')).toBeNull();
  });

  it('preload populates the map and flags loaded', async () => {
    mockedGetAll.mockResolvedValue({ lessons: [lesson('a'), lesson('b')] });
    await useLessonsStore.getState().preload();
    const s = useLessonsStore.getState();
    expect(mockedGetAll).toHaveBeenCalledTimes(1);
    expect(s.loaded).toBe(true);
    expect(s.loading).toBe(false);
    expect(s.getLesson('a')?.title).toBe('T a');
    expect(s.getLesson('missing')).toBeNull();
  });

  it('preload skips fetch when already loaded', async () => {
    useLessonsStore.setState({ loaded: true });
    await useLessonsStore.getState().preload();
    expect(mockedGetAll).not.toHaveBeenCalled();
  });

  it('preload skips fetch when already loading', async () => {
    useLessonsStore.setState({ loading: true });
    await useLessonsStore.getState().preload();
    expect(mockedGetAll).not.toHaveBeenCalled();
  });

  it('preload failure stays unloaded and clears loading', async () => {
    mockedGetAll.mockRejectedValue(new Error('net down'));
    await useLessonsStore.getState().preload();
    const s = useLessonsStore.getState();
    expect(s.loaded).toBe(false);
    expect(s.loading).toBe(false);
    expect(s.lessons.size).toBe(0);
  });

  it('duplicate ids collapse to one entry (last wins)', async () => {
    mockedGetAll.mockResolvedValue({ lessons: [lesson('a'), lesson('a')] });
    await useLessonsStore.getState().preload();
    expect(useLessonsStore.getState().lessons.size).toBe(1);
  });
});
