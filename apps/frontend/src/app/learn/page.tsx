'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { lessonAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Lock,
  Target,
  Trophy,
} from 'lucide-react';

type PracticeType = 'normal' | 'coding' | 'assessment';

type SectionSummary = {
  sectionId: number;
  title: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  firstLessonId: string | null;
  firstUnlockedLessonId: string | null;
  firstUnlockedPage: number;
  totalPages: number;
};

type LessonProgress = {
  completed: boolean;
  bestWpm: number;
  bestAccuracy: number;
  stars: number;
  attempts: number;
};

type SectionLesson = {
  id: string;
  level: number;
  order: number;
  title: string;
  description: string;
  keys: string[];
  difficulty: string;
  targetWpm: number;
  minAccuracy: number;
  exerciseType: string;
  content: string;
  section: number;
  isCheckpoint: boolean;
  userProgress: LessonProgress[];
  isUnlocked: boolean;
  isCompleted: boolean;
};

type SectionPageResponse = {
  section: {
    id: number;
    name: string;
    description: string;
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
  };
  pagination: {
    page: number;
    pageCount: number;
    totalPages: number;
    totalLessons: number;
    startIndex: number;
    endIndex: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
  lessons: SectionLesson[];
};

const PAGE_COUNT = 5;

const parsePracticeType = (value: string | null): PracticeType => {
  if (value === 'coding' || value === 'assessment' || value === 'normal') {
    return value;
  }
  return 'normal';
};

const parsePositiveInt = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
};

const parsePage = (value: string | null): number => {
  const parsed = parsePositiveInt(value);
  if (!parsed) return 1;
  return Math.max(1, Math.min(PAGE_COUNT, parsed));
};

const getSectionPageKey = (sectionId: number, page: number): string => `${sectionId}:${page}`;

const getLessonSummaryText = (lesson: SectionLesson): string => {
  if (lesson.keys.length > 0) {
    return `Practice keys: ${lesson.keys.join(', ')}`;
  }

  const progress = lesson.userProgress[0];
  if (progress?.attempts) {
    return `Attempts: ${progress.attempts}`;
  }

  return 'Typing practice';
};

function LearnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPractice = parsePracticeType(searchParams.get('practice'));
  const initialSection = parsePositiveInt(searchParams.get('section'));
  const initialPage = parsePage(searchParams.get('page'));

  const initialSelectionRef = useRef({
    practice: initialPractice,
    sectionId: initialSection,
    page: initialPage,
    consumed: false,
  });

  const [practice, setPractice] = useState<PracticeType>(initialPractice);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const [sectionPages, setSectionPages] = useState<Record<string, SectionPageResponse>>({});
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const updateLearnQuery = useCallback(
    (nextPractice: PracticeType, nextSectionId: number | null, nextPage: number) => {
      const params = new URLSearchParams();
      params.set('practice', nextPractice);

      if (nextSectionId !== null) {
        params.set('section', String(nextSectionId));
        params.set('page', String(nextPage));
      }

      router.replace(`/learn?${params.toString()}`);
    },
    [router]
  );

  const selectLessonForPage = useCallback((pageData: SectionPageResponse) => {
    const firstUnlocked =
      pageData.lessons.find((lesson) => lesson.isUnlocked && !lesson.isCompleted) ??
      pageData.lessons.find((lesson) => lesson.isUnlocked);

    setSelectedLessonId(firstUnlocked?.id ?? pageData.lessons[0]?.id ?? null);
  }, []);

  const loadSectionPage = useCallback(
    async (sectionId: number, page: number, options?: { shouldPreselect?: boolean }) => {
      const normalizedPage = Math.max(1, Math.min(PAGE_COUNT, page));
      const cacheKey = getSectionPageKey(sectionId, normalizedPage);
      const cachedPage = sectionPages[cacheKey];

      setPageError(null);
      setSelectedSectionId(sectionId);
      setCurrentPage(normalizedPage);

      if (cachedPage) {
        if (options?.shouldPreselect) {
          selectLessonForPage(cachedPage);
        }
        updateLearnQuery(practice, sectionId, normalizedPage);
        return;
      }

      setPageLoading(true);
      try {
        const pageData = await lessonAPI.getSectionPage(sectionId, normalizedPage, PAGE_COUNT);
        setSectionPages((prev) => ({
          ...prev,
          [cacheKey]: pageData,
        }));

        if (options?.shouldPreselect) {
          selectLessonForPage(pageData);
        }

        updateLearnQuery(practice, sectionId, normalizedPage);
      } catch (error) {
        console.error('Failed to load section page', error);
        setPageError('Failed to load lessons for this section page. Please try again.');
      } finally {
        setPageLoading(false);
      }
    },
    [practice, sectionPages, selectLessonForPage, updateLearnQuery]
  );

  useEffect(() => {
    let isMounted = true;

    const fetchSections = async () => {
      try {
        setSectionsLoading(true);
        setSectionsError(null);
        setPageError(null);

        const response = await lessonAPI.getSectionSummaries(practice);

        if (!isMounted) return;

        const summaries = response.sections;
        setSections(summaries);

        if (practice === 'assessment') {
          setSelectedSectionId(null);
          setSelectedLessonId(null);
          setCurrentPage(1);
          updateLearnQuery('assessment', null, 1);
          return;
        }

        if (!summaries.length) {
          setSelectedSectionId(null);
          setSelectedLessonId(null);
          setCurrentPage(1);
          updateLearnQuery(practice, null, 1);
          return;
        }

        const shouldUseInitialSelection =
          !initialSelectionRef.current.consumed && initialSelectionRef.current.practice === practice;

        const requestedSection = shouldUseInitialSelection
          ? initialSelectionRef.current.sectionId
          : null;

        const matchedSection =
          requestedSection !== null
            ? summaries.find((summary) => summary.sectionId === requestedSection)
            : null;

        const targetSection = matchedSection ?? summaries[0];

        const requestedPage = shouldUseInitialSelection
          ? initialSelectionRef.current.page
          : targetSection.firstUnlockedPage;

        const fallbackPage =
          targetSection.firstUnlockedPage >= 1 && targetSection.firstUnlockedPage <= PAGE_COUNT
            ? targetSection.firstUnlockedPage
            : 1;

        const targetPage = Math.max(1, Math.min(PAGE_COUNT, requestedPage || fallbackPage));

        initialSelectionRef.current.consumed = true;

        await loadSectionPage(targetSection.sectionId, targetPage, {
          shouldPreselect: true,
        });
      } catch (error) {
        console.error('Failed to load section summaries', error);
        if (!isMounted) return;

        setSections([]);
        setSectionsError('Failed to load section summaries. Please try again later.');
      } finally {
        if (isMounted) {
          setSectionsLoading(false);
        }
      }
    };

    void fetchSections();

    return () => {
      isMounted = false;
    };
  }, [practice, loadSectionPage, updateLearnQuery]);

  const selectedSectionSummary = useMemo(
    () => sections.find((section) => section.sectionId === selectedSectionId) ?? null,
    [sections, selectedSectionId]
  );

  const selectedSectionPage = useMemo(() => {
    if (selectedSectionId === null) return null;
    return sectionPages[getSectionPageKey(selectedSectionId, currentPage)] ?? null;
  }, [sectionPages, selectedSectionId, currentPage]);

  const selectedLesson = useMemo(() => {
    if (!selectedSectionPage || !selectedLessonId) return null;
    return selectedSectionPage.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  }, [selectedSectionPage, selectedLessonId]);

  const handlePracticeTabClick = (nextPractice: PracticeType) => {
    if (nextPractice === practice) return;

    setPractice(nextPractice);
    setSections([]);
    setSelectedSectionId(null);
    setSelectedLessonId(null);
    setCurrentPage(1);
    setPageError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="mb-2 text-4xl font-bold">Learn Touch Typing</h1>
        <p className="text-muted-foreground">
          Pick a practice type, open a section, and load only the lesson page you need.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2 rounded-xl border bg-card p-2">
        {(['normal', 'coding', 'assessment'] as PracticeType[]).map((tab) => (
          <Button
            key={tab}
            variant={practice === tab ? 'default' : 'ghost'}
            onClick={() => handlePracticeTabClick(tab)}
            className="capitalize"
          >
            {tab}
          </Button>
        ))}
      </div>

      {practice === 'assessment' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Assessment Practice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Run a typing skill assessment and get lesson recommendations based on your speed and
              accuracy.
            </p>
            <Link href="/learn/assessment/test">
              <Button className="w-full sm:w-auto">
                Start Assessment
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {sectionsError && (
            <div className="mb-6 rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-900 dark:text-yellow-200">Error</p>
                  <p className="text-yellow-800 dark:text-yellow-300">{sectionsError}</p>
                </div>
              </div>
            </div>
          )}

          {sectionsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No sections available for this practice type.
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => {
                  const isActive = selectedSectionId === section.sectionId;
                  return (
                    <button
                      key={section.sectionId}
                      type="button"
                      className={`rounded-xl border p-5 text-left transition-all ${
                        isActive
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-primary/40'
                      }`}
                      onClick={() => {
                        void loadSectionPage(
                          section.sectionId,
                          section.firstUnlockedPage || 1,
                          { shouldPreselect: true }
                        );
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        <span className="text-xs text-muted-foreground">
                          Section {section.sectionId}
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground">{section.description}</p>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {section.completedLessons}/{section.totalLessons}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${section.completionPercentage}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSectionSummary && (
                <div className="space-y-4 rounded-xl border p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedSectionSummary.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedSectionSummary.description}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedSectionSummary.completedLessons}/{selectedSectionSummary.totalLessons}{' '}
                      completed
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((page) => (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => {
                          if (!selectedSectionId) return;
                          void loadSectionPage(selectedSectionId, page, {
                            shouldPreselect: true,
                          });
                        }}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  {pageError && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
                      {pageError}
                    </div>
                  )}

                  {pageLoading && !selectedSectionPage ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-28 w-full" />
                      ))}
                    </div>
                  ) : selectedSectionPage ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedSectionPage.lessons.map((lesson) => {
                        const isSelected = lesson.id === selectedLessonId;
                        const accuracy = lesson.userProgress[0]?.bestAccuracy;
                        return (
                          <Link
                            key={lesson.id}
                            href={lesson.isUnlocked ? `/learn/${lesson.id}` : '#'}
                            className={`rounded-lg border p-4 transition-all ${
                              lesson.isUnlocked
                                ? 'hover:border-primary/40'
                                : 'cursor-not-allowed opacity-60'
                            } ${isSelected ? 'ring-1 ring-primary border-primary' : ''}`}
                            onMouseEnter={() => setSelectedLessonId(lesson.id)}
                            onFocus={() => setSelectedLessonId(lesson.id)}
                          >
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Level {lesson.level}</p>
                                <h4 className="font-semibold">{lesson.title}</h4>
                              </div>
                              <div className="flex items-center gap-1">
                                {lesson.isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {!lesson.isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                {lesson.isCheckpoint && <Trophy className="h-4 w-4 text-yellow-600" />}
                              </div>
                            </div>

                            <p className="mb-3 text-sm text-muted-foreground">{getLessonSummaryText(lesson)}</p>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Target {lesson.targetWpm} WPM
                              </span>
                              <span>Min {Math.max(0, lesson.minAccuracy - 10)}%</span>
                            </div>

                            {typeof accuracy === 'number' && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Best accuracy: {accuracy.toFixed(1)}%
                              </p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
                      Open a section to load lessons.
                    </div>
                  )}

                  {selectedLesson && (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                      <p className="font-medium">Selected Lesson: {selectedLesson.title}</p>
                      <p className="text-muted-foreground">{selectedLesson.description}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="mb-2 text-4xl font-bold">Learn Touch Typing</h1>
            <p className="text-muted-foreground">Loading learn page...</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-44 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <LearnPageContent />
    </Suspense>
  );
}
