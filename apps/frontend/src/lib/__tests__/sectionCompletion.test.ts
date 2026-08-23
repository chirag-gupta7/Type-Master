import { isSectionComplete } from '../sectionCompletion';

describe('isSectionComplete', () => {
  const lessons = [
    { id: 'a', section: 1, userProgress: [{ completed: true }] },
    { id: 'b', section: 1, userProgress: [{ completed: false }] },
    { id: 'c', section: 1, userProgress: [] },
    { id: 'd', section: 2, userProgress: [{ completed: true }] },
  ];

  it('returns false when a lesson in the section is not yet completed', () => {
    // Completing 'b' leaves 'c' incomplete.
    expect(isSectionComplete(lessons, 1, 'b')).toBe(false);
  });

  it('returns true when the just-completed lesson was the last incomplete one', () => {
    const almostDone = [
      { id: 'a', section: 1, userProgress: [{ completed: true }] },
      { id: 'b', section: 1, userProgress: [{ completed: true }] },
      { id: 'c', section: 1, userProgress: [] },
    ];
    expect(isSectionComplete(almostDone, 1, 'c')).toBe(true);
  });

  it('treats a lesson with no progress record as incomplete', () => {
    expect(isSectionComplete(lessons, 1, 'c')).toBe(false);
  });

  it('ignores lessons in other sections', () => {
    const other = [
      { id: 'x', section: 9, userProgress: [] },
      { id: 'y', section: 1, userProgress: [{ completed: true }] },
    ];
    expect(isSectionComplete(other, 1, 'y')).toBe(true);
  });

  it('returns false when the section has no lessons', () => {
    expect(isSectionComplete(lessons, 42, 'a')).toBe(false);
  });
});
