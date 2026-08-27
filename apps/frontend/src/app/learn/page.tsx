'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { lessonAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, ChevronRight, Clock, Lock, Target, Trophy, Sparkles, BookOpen } from 'lucide-react';

type PracticeType = 'normal' | 'coding' | 'assessment';
type SectionSummary = { sectionId: number; title: string; description: string; totalLessons: number; completedLessons: number; completionPercentage: number; firstLessonId: string | null; firstUnlockedLessonId: string | null; firstUnlockedPage: number; totalPages: number; };
type LessonProgress = { completed: boolean; bestWpm: number; bestAccuracy: number; stars: number; attempts: number; };
type SectionLesson = { id: string; level: number; order: number; title: string; description: string; keys: string[]; difficulty: string; targetWpm: number; minAccuracy: number; exerciseType: string; content: string; section: number; isCheckpoint: boolean; userProgress: LessonProgress[]; isUnlocked: boolean; isCompleted: boolean; };
type SectionPageResponse = { section: { id: number; name: string; description: string; totalLessons: number; completedLessons: number; completionPercentage: number; }; pagination: { page: number; pageCount: number; totalPages: number; totalLessons: number; startIndex: number; endIndex: number; hasPreviousPage: boolean; hasNextPage: boolean; }; lessons: SectionLesson[]; };

const PAGE_COUNT = 5;
const parsePracticeType = (v: string | null): PracticeType => (v === 'coding' || v === 'assessment' || v === 'normal' ? v : 'normal');
const parsePositiveInt = (v: string | null): number | null => { if (!v) return null; const n = Number.parseInt(v, 10); return Number.isNaN(n) || n <= 0 ? null : n; };
const parsePage = (v: string | null): number => { const p = parsePositiveInt(v); if (!p) return 1; return Math.max(1, Math.min(PAGE_COUNT, p)); };
const getSectionPageKey = (s: number, p: number) => `${s}:${p}`;
const getLessonSummaryText = (l: SectionLesson) => {
  if (l.keys.length > 0) return `Keys: ${l.keys.join(', ')}`;
  const pr = l.userProgress[0];
  if (pr?.attempts) return `Attempts: ${pr.attempts}`;
  return 'Typing practice';
};

function LearnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPractice = parsePracticeType(searchParams.get('practice'));
  const initialSection = parsePositiveInt(searchParams.get('section'));
  const initialPage = parsePage(searchParams.get('page'));
  const initialSelectionRef = useRef({ practice: initialPractice, sectionId: initialSection, page: initialPage, consumed: false });
  const [practice, setPractice] = useState<PracticeType>(initialPractice);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [sectionPages, setSectionPages] = useState<Record<string, SectionPageResponse>>({});
  const sectionPagesRef = useRef<Record<string, SectionPageResponse>>({});
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const updateLearnQuery = useCallback((nextPractice: PracticeType, nextSectionId: number | null, nextPage: number) => {
    const params = new URLSearchParams();
    params.set('practice', nextPractice);
    if (nextSectionId !== null) { params.set('section', String(nextSectionId)); params.set('page', String(nextPage)); }
    router.replace(`/learn?${params.toString()}`);
  }, [router]);

  const selectLessonForPage = useCallback((pageData: SectionPageResponse) => {
    const firstUnlocked = pageData.lessons.find((l) => l.isUnlocked && !l.isCompleted) ?? pageData.lessons.find((l) => l.isUnlocked);
    setSelectedLessonId(firstUnlocked?.id ?? pageData.lessons[0]?.id ?? null);
  }, []);

  const loadSectionPage = useCallback(async (sectionId: number, page: number, options?: { shouldPreselect?: boolean }) => {
    const normalizedPage = Math.max(1, Math.min(PAGE_COUNT, page));
    const cacheKey = getSectionPageKey(sectionId, normalizedPage);
    const cached = sectionPagesRef.current[cacheKey];
    setPageError(null); setSelectedSectionId(sectionId); setCurrentPage(normalizedPage);
    if (cached) { if (options?.shouldPreselect) selectLessonForPage(cached); updateLearnQuery(practice, sectionId, normalizedPage); return; }
    setPageLoading(true);
    try {
      const data = await lessonAPI.getSectionPage(sectionId, normalizedPage, PAGE_COUNT);
      setSectionPages((prev) => { const next = { ...prev, [cacheKey]: data }; sectionPagesRef.current = next; return next; });
      if (options?.shouldPreselect) selectLessonForPage(data);
      updateLearnQuery(practice, sectionId, normalizedPage);
    } catch { setPageError('Failed to load lessons for this section page. Please try again.'); }
    finally { setPageLoading(false); }
  }, [practice, selectLessonForPage, updateLearnQuery]);

  useEffect(() => {
    let mounted = true;
    const fetchSections = async () => {
      try {
        setSectionsLoading(true); setSectionsError(null); setPageError(null);
        const res = await lessonAPI.getSectionSummaries(practice);
        if (!mounted) return;
        const summaries = res.sections;
        setSections(summaries);
        if (practice === 'assessment') { setSelectedSectionId(null); setSelectedLessonId(null); setCurrentPage(1); updateLearnQuery('assessment', null, 1); return; }
        if (!summaries.length) { setSelectedSectionId(null); setSelectedLessonId(null); setCurrentPage(1); updateLearnQuery(practice, null, 1); return; }
        const shouldUseInitial = !initialSelectionRef.current.consumed && initialSelectionRef.current.practice === practice;
        const requestedSection = shouldUseInitial ? initialSelectionRef.current.sectionId : null;
        const matched = requestedSection !== null ? summaries.find((s) => s.sectionId === requestedSection) : null;
        const targetSection = matched ?? summaries[0];
        const requestedPage = shouldUseInitial ? initialSelectionRef.current.page : targetSection.firstUnlockedPage;
        const fallbackPage = targetSection.firstUnlockedPage >= 1 && targetSection.firstUnlockedPage <= PAGE_COUNT ? targetSection.firstUnlockedPage : 1;
        const targetPage = Math.max(1, Math.min(PAGE_COUNT, requestedPage || fallbackPage));
        initialSelectionRef.current.consumed = true;
        await loadSectionPage(targetSection.sectionId, targetPage, { shouldPreselect: true });
      } catch {
        if (!mounted) return;
        setSections([]); setSectionsError('Failed to load section summaries. Please try again later.');
      } finally { if (mounted) setSectionsLoading(false); }
    };
    void fetchSections();
    return () => { mounted = false; };
  }, [practice, loadSectionPage, updateLearnQuery]);

  const selectedSectionSummary = useMemo(() => sections.find((s) => s.sectionId === selectedSectionId) ?? null, [sections, selectedSectionId]);
  const selectedSectionPage = useMemo(() => selectedSectionId === null ? null : sectionPages[getSectionPageKey(selectedSectionId, currentPage)] ?? null, [sectionPages, selectedSectionId, currentPage]);
  const selectedLesson = useMemo(() => !selectedSectionPage || !selectedLessonId ? null : selectedSectionPage.lessons.find((l) => l.id === selectedLessonId) ?? null, [selectedSectionPage, selectedLessonId]);

  const handlePracticeTabClick = (next: PracticeType) => {
    if (next === practice) return;
    setPractice(next); setSections([]); setSelectedSectionId(null); setSelectedLessonId(null); setCurrentPage(1); setPageError(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Learn Touch Typing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Pick a track, open a section, and practice only what you need — progress unlocks as you improve.</p>
        </div>
        <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium"><Sparkles className="h-3.5 w-3.5 text-[var(--theme-primary)]" /> Adaptive unlocks</span>
      </div>

      <div className="mt-6 inline-flex rounded-full border bg-card p-1">
        {(['normal','coding','assessment'] as PracticeType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handlePracticeTabClick(tab)}
            aria-pressed={practice === tab}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition focus-ring ${practice === tab ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {practice === 'assessment' ? (
        <Card className="mt-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-[var(--theme-primary)]" /> Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Run a quick placement test and get a personalized starting point.</p>
            <Link href="/learn/assessment/test"><Button variant="primary" className="rounded-full">Start assessment <ChevronRight className="ml-1 h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {sectionsError && <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm flex gap-2"><AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" /><span>{sectionsError}</span></div>}

          {sectionsLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-44 w-full rounded-[20px]" />)}</div>
          ) : sections.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No sections available for this track.</div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sections.map((section) => {
                  const isActive = selectedSectionId === section.sectionId;
                  return (
                    <button
                      key={section.sectionId}
                      type="button"
                      onClick={() => void loadSectionPage(section.sectionId, section.firstUnlockedPage || 1, { shouldPreselect: true })}
                      className={`rounded-[20px] border p-5 text-left transition focus-ring ${isActive ? 'border-foreground bg-foreground text-background shadow-sm' : 'bg-card hover:bg-accent'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5"><BookOpen className="h-4 w-4 opacity-60" /> {section.title}</h2>
                        <span className={`text-xs ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>§ {section.sectionId}</span>
                      </div>
                      <p className={`mt-1 text-sm leading-5 ${isActive ? 'text-background/80' : 'text-muted-foreground'}`}>{section.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className={isActive ? 'text-background/70' : 'text-muted-foreground'}>Progress</span>
                        <span className="font-medium">{section.completedLessons}/{section.totalLessons}</span>
                      </div>
                      <div className={`mt-1.5 h-2 w-full overflow-hidden rounded-full ${isActive ? 'bg-background/20' : 'bg-muted'}`}>
                        <div className={`h-full rounded-full ${isActive ? 'bg-background' : 'bg-foreground'}`} style={{ width: `${section.completionPercentage}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedSectionSummary && (
                <div className="mt-6 rounded-[20px] border bg-card/60 p-4 md:p-5 backdrop-blur">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div><h3 className="text-xl font-bold tracking-tight">{selectedSectionSummary.title}</h3><p className="text-sm text-muted-foreground">{selectedSectionSummary.description}</p></div>
                    <div className="text-xs text-muted-foreground">{selectedSectionSummary.completedLessons}/{selectedSectionSummary.totalLessons} completed</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1,2,3,4,5].map((page) => (
                      <Button key={page} size="sm" variant={page === currentPage ? 'default' : 'outline'} onClick={() => selectedSectionId && void loadSectionPage(selectedSectionId, page, { shouldPreselect: true })} className="rounded-full min-w-9">
                        {page}
                      </Button>
                    ))}
                  </div>

                  {pageError && <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{pageError}</div>}

                  {pageLoading && !selectedSectionPage ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">{[1,2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}</div>
                  ) : selectedSectionPage ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectedSectionPage.lessons.map((lesson) => {
                        const isSelected = lesson.id === selectedLessonId;
                        const accuracy = lesson.userProgress[0]?.bestAccuracy;
                        const cardBase = `rounded-2xl border p-4 transition focus-ring ${isSelected ? 'border-foreground ring-1 ring-foreground' : ''} ${lesson.isUnlocked ? 'bg-card hover:bg-accent' : 'opacity-60 bg-muted/40'}`;
                        const content = (
                          <>
                            <div className="flex items-start justify-between gap-3">
                              <div><p className="text-xs tracking-widest text-muted-foreground">LEVEL {lesson.level}</p><h4 className="text-sm font-semibold tracking-tight">{lesson.title}</h4></div>
                              <div className="flex items-center gap-1">
                                {lesson.isCompleted && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                {!lesson.isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                                {lesson.isCheckpoint && <Trophy className="h-4 w-4 text-amber-500" />}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">{getLessonSummaryText(lesson)}</p>
                            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> Target {lesson.targetWpm} WPM</span>
                              <span>Min {Math.max(0, lesson.minAccuracy - 10)}%</span>
                            </div>
                            {typeof accuracy === 'number' && <p className="mt-2 text-xs text-muted-foreground">Best {accuracy.toFixed(1)}%</p>}
                          </>
                        );
                        if (!lesson.isUnlocked) return <div key={lesson.id} className={cardBase} tabIndex={0} onFocus={() => setSelectedLessonId(lesson.id)} onMouseEnter={() => setSelectedLessonId(lesson.id)}>{content}</div>;
                        return <Link key={lesson.id} href={`/learn/${lesson.id}`} className={cardBase}>{content}</Link>;
                      })}
                    </div>
                  ) : null}

                  {selectedLesson && <div className="mt-4 rounded-2xl border bg-background/60 p-3 text-sm"><p className="font-medium">Selected: {selectedLesson.title}</p><p className="text-muted-foreground">{selectedLesson.description}</p></div>}
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
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><Skeleton className="h-44 w-full rounded-[20px]" /></div>}>
      <LearnPageContent />
    </Suspense>
  );
}
