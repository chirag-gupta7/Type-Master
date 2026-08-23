/**
 * Regression tests: the "Section N Complete!" milestone used to fire on every
 * lesson save whenever sectionsCompleted was non-empty, even when nothing new
 * had been completed. It must fire only for explicitly newly-completed
 * sections.
 */

jest.mock('@/context/AchievementContext', () => ({
  useAchievements: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react';
import { useAchievements } from '@/context/AchievementContext';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';

const result = {
  wpm: 50,
  accuracy: 95,
  lessonId: 'lesson-1',
  completed: true,
  stars: 1,
};

describe('useAchievementChecker - section milestones', () => {
  it('does not fire a section milestone merely because sectionsCompleted is non-empty', async () => {
    const showMilestone = jest.fn();
    (useAchievements as jest.Mock).mockReturnValue({
      showAchievement: jest.fn(),
      showMilestone,
    });

    const { result: hook } = renderHook(() => useAchievementChecker());

    await act(async () => {
      await hook.current.checkAchievements(result, {
        lessonsCompleted: 0,
        sectionsCompleted: [3],
      });
    });

    expect(showMilestone).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'section_complete' })
    );
  });

  it('fires exactly one section milestone per newly completed section', async () => {
    const showMilestone = jest.fn();
    (useAchievements as jest.Mock).mockReturnValue({
      showAchievement: jest.fn(),
      showMilestone,
    });

    const { result: hook } = renderHook(() => useAchievementChecker());

    await act(async () => {
      await hook.current.checkAchievements(result, {
        lessonsCompleted: 0,
        sectionsCompleted: [],
        newlyCompletedSections: [3],
      });
    });

    expect(showMilestone).toHaveBeenCalledTimes(1);
    expect(showMilestone).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'section_complete', count: 3 })
    );
  });

  it('does not repeat the milestone when the section is no longer newly completed', async () => {
    const showMilestone = jest.fn();
    (useAchievements as jest.Mock).mockReturnValue({
      showAchievement: jest.fn(),
      showMilestone,
    });

    const { result: hook } = renderHook(() => useAchievementChecker());

    await act(async () => {
      await hook.current.checkAchievements(result, {
        lessonsCompleted: 1,
        sectionsCompleted: [3],
        newlyCompletedSections: [],
      });
    });

    expect(showMilestone).not.toHaveBeenCalled();
  });
});
