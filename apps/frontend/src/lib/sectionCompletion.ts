/**
 * Determines whether completing `justCompletedLessonId` finished every lesson
 * in its section, based on the lessons list (with user progress) returned by
 * the lessons API.
 */
type LessonWithProgressLike = {
  id: string;
  section: number;
  userProgress?: Array<{ completed: boolean }>;
};

export const isSectionComplete = (
  lessons: LessonWithProgressLike[],
  sectionId: number,
  justCompletedLessonId: string
): boolean => {
  const sectionLessons = lessons.filter((lesson) => lesson.section === sectionId);

  if (sectionLessons.length === 0) {
    return false;
  }

  return sectionLessons.every(
    (lesson) =>
      lesson.id === justCompletedLessonId ||
      Boolean(lesson.userProgress?.some((progress) => progress.completed))
  );
};
