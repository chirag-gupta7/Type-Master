'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl, API_VERSION } from '@/lib/apiBase';
import {
  Clock,
  Target,
  TrendingUp,
  Award,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

interface AssessmentResult {
  wpm: number;
  accuracy: number;
  recommendedSkillLevel: string;
  recommendedLessonLevel: number;
  weakFingers: string[];
  problematicKeys: string[];
}

interface RecommendedLesson {
  id: string;
  level: number;
  title: string;
  description: string;
  section: number;
  targetWpm: number;
  minAccuracy: number;
}

type SessionUserWithId = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function AssessmentPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const sessionUser = session?.user as SessionUserWithId | undefined;

  // State management
  const [stage, setStage] = useState<'intro' | 'testing' | 'results'>('intro');
  const [testContent, setTestContent] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [recommendedLesson, setRecommendedLesson] = useState<RecommendedLesson | null>(null);
  const [feedback, setFeedback] = useState('');
  const [latestAssessment, setLatestAssessment] = useState<AssessmentResult | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check session and fetch initial data
  useEffect(() => {
    const initializePage = async () => {
      try {
        setPageLoading(true);
        setError(null);

        // Wait for session to load
        if (sessionStatus === 'loading') {
          return;
        }

        // Fetch assessment content
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

        if (!hasToken && sessionStatus !== 'authenticated') {
          // Use fallback content for unauthenticated users
          setTestContent(
            'the quick brown fox jumps over the lazy dog. pack my box with five dozen liquor jugs.'
          );
          setPageLoading(false);
          return;
        }

        // Try to fetch from API
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${getApiBaseUrl()}/api/${API_VERSION}/assessment/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({
              userId: sessionUser?.id || 'demo-user-id',
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to fetch assessment content');
          }

          const data = await response.json();
          setTestContent(data.content || 'the quick brown fox jumps over the lazy dog');

          // Try to fetch latest assessment
          try {
            const latestResponse = await fetch(
              `${getApiBaseUrl()}/api/${API_VERSION}/assessment/latest`,
              {
                headers: {
                  ...(token && { Authorization: `Bearer ${token}` }),
                },
              }
            );

            if (latestResponse.ok) {
              const latestData = await latestResponse.json();
              setLatestAssessment(latestData.assessment);
            }
          } catch (err) {
            // No previous assessment; continue with defaults
          }
        } catch (apiError) {
          console.error('API error, using fallback:', apiError);
          setTestContent(
            'the quick brown fox jumps over the lazy dog. pack my box with five dozen liquor jugs.'
          );
        }
      } catch (err) {
        console.error('Page initialization error:', err);
        setError('Failed to load assessment. Please try again.');
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [session, sessionStatus]);

  // Fetch assessment content on mount (keep original logic as backup)
  useEffect(() => {
    const fetchAssessmentContent = async () => {
      try {
        // For now, use demo user ID - replace with actual auth later
        const userId = 'demo-user-id';

        const response = await fetch(`${getApiBaseUrl()}/api/${API_VERSION}/assessment/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        const data = await response.json();
        setTestContent(data.content);
      } catch (error) {
        console.error('Failed to fetch assessment content:', error);
        // Fallback content
        setTestContent('the quick brown fox jumps over the lazy dog');
      }
    };

    fetchAssessmentContent();
  }, []);

  const startAssessment = useCallback(() => {
    setStage('testing');
    setStartTime(Date.now());
    setUserInput('');
    setCurrentIndex(0);
    setMistakes({});
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!startTime) return;

      const key = e.key;

      // Ignore special keys
      if (key.length > 1 && key !== 'Backspace') return;

      if (key === 'Backspace') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setUserInput((prev) => prev.slice(0, -1));
        }
        return;
      }

      const expectedChar = testContent[currentIndex];
      const typedChar = key;

      // Track mistake
      if (typedChar !== expectedChar) {
        setMistakes((prev) => ({
          ...prev,
          [expectedChar]: (prev[expectedChar] || 0) + 1,
        }));
      }

      setUserInput((prev) => prev + typedChar);
      setCurrentIndex((prev) => prev + 1);

      // Check if test is complete
      if (currentIndex + 1 >= testContent.length) {
        completeAssessment(typedChar === expectedChar);
      }
    },
    [startTime, testContent, currentIndex]
  );

  const completeAssessment = async (lastCharCorrect: boolean) => {
    if (!startTime) return;

    const endTime = Date.now();
    setSubmitting(true);
    setError(null);

    const timeSpent = (endTime - startTime) / 1000; // seconds
    const totalChars = testContent.length;
    const correctChars =
      totalChars - Object.values(mistakes).reduce((a, b) => a + b, 0) - (lastCharCorrect ? 0 : 1);
    const accuracy = (correctChars / totalChars) * 100;
    const wpm = totalChars / 5 / (timeSpent / 60); // Standard WPM calculation

    const calculatedResult = {
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy * 10) / 10,
      timeSpent,
    };

    try {
      const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');

      if (!hasToken && sessionStatus !== 'authenticated') {
        // Offline mode - show results without saving
        setResult({
          wpm: calculatedResult.wpm,
          accuracy: calculatedResult.accuracy,
          recommendedSkillLevel: 'Intermediate',
          recommendedLessonLevel: 3,
          weakFingers: [],
          problematicKeys: Object.keys(mistakes).slice(0, 5),
        });
        setFeedback('Sign in to save your assessment results!');
        setStage('results');
        return;
      }

      const token = localStorage.getItem('accessToken');
      const userId = sessionUser?.id || 'demo-user-id';

      const response = await fetch(`${getApiBaseUrl()}/api/${API_VERSION}/assessment/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          userId,
          wpm: calculatedResult.wpm,
          accuracy: calculatedResult.accuracy,
          mistakesByKey: mistakes,
          weakFingers: [],
          timeSpent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const data = await response.json();
      setResult(data.assessment);
      setRecommendedLesson(data.recommendedLesson);
      setFeedback(data.feedback || 'Great job completing the assessment!');
      setStage('results');
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      setError('Failed to save assessment results. Showing offline results.');

      // Show results anyway even if save failed
      setResult({
        wpm: calculatedResult.wpm,
        accuracy: calculatedResult.accuracy,
        recommendedSkillLevel: 'Intermediate',
        recommendedLessonLevel: 3,
        weakFingers: [],
        problematicKeys: Object.keys(mistakes).slice(0, 5),
      });
      setFeedback('Assessment complete! (Results not saved)');
      setStage('results');
    } finally {
      setSubmitting(false);
    }
  };

  const getCharStatus = (index: number) => {
    if (index >= userInput.length) return 'pending';
    if (userInput[index] === testContent[index]) return 'correct';
    return 'incorrect';
  };

  // Render different content based on loading/error/complete states
  const renderContent = () => {
    // Page is loading
    if (pageLoading || sessionStatus === 'loading') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Error state
    if (error && !testContent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
              <div className="flex flex-col items-center justify-center py-12">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Failed to Load Assessment
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Submitting state (overlay)
    const submittingOverlay = submitting && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-900 dark:text-white font-semibold">
            Analyzing your performance...
          </p>
        </div>
      </motion.div>
    );

    // Main content (intro, testing, results stages)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Error banner (non-blocking) */}
          {error && testContent && (
            <div className="mb-6 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Notice</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {stage === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
              >
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center"
                  >
                    <Target className="w-10 h-10 text-white" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    Skill Assessment
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    Let's find the perfect starting point for your typing journey
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Quick & Easy
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Takes only 1-2 minutes to complete
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Personalized Path
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        We'll recommend lessons based on your current skill level
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Track Progress
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Identify weak areas and focus on improvement
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    What to expect:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Type a short text passage as accurately as you can
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      We'll measure your speed (WPM) and accuracy
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Get instant feedback and personalized recommendations
                    </li>
                  </ul>
                </div>

                {latestAssessment && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">
                          Previous Assessment Found
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {latestAssessment.wpm} WPM • {latestAssessment.accuracy}% Accuracy
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={startAssessment}
                  disabled={!testContent}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testContent ? (
                    <>
                      Start Assessment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                  You can skip this and browse lessons directly if you prefer
                </p>
              </motion.div>
            )}

            {stage === 'testing' && (
              <motion.div
                key="testing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
              >
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Type this text:
                    </h2>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {currentIndex} / {testContent.length}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentIndex / testContent.length) * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-6 font-mono text-2xl leading-relaxed">
                  {testContent.split('').map((char, index) => {
                    const status = getCharStatus(index);
                    return (
                      <span
                        key={index}
                        className={`
                        ${index === currentIndex ? 'bg-blue-200 dark:bg-blue-800' : ''}
                        ${status === 'correct' ? 'text-green-600 dark:text-green-400' : ''}
                        ${status === 'incorrect' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30' : ''}
                        ${status === 'pending' ? 'text-gray-400 dark:text-gray-600' : ''}
                      `}
                      >
                        {char === ' ' ? '·' : char}
                      </span>
                    );
                  })}
                </div>

                <textarea
                  autoFocus
                  value={userInput}
                  onKeyDown={handleKeyPress}
                  onChange={() => {}} // Controlled by onKeyDown
                  className="w-full h-32 p-4 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-blue-500 focus:outline-none font-mono text-lg resize-none"
                  placeholder="Start typing here..."
                />

                <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                  Type exactly as shown above. Use backspace to correct mistakes.
                </p>
              </motion.div>
            )}

            {stage === 'results' && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="w-20 h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center"
                  >
                    <Award className="w-10 h-10" />
                  </motion.div>
                  <h2 className="text-3xl font-bold mb-2">Assessment Complete!</h2>
                  <p className="text-green-100 text-lg">{feedback}</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                  >
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Speed</p>
                      <p className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {result.wpm}
                      </p>
                      <p className="text-gray-500 dark:text-gray-500">WPM</p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                  >
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-2">Accuracy</p>
                      <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-1">
                        {result.accuracy}%
                      </p>
                      <p className="text-gray-500 dark:text-gray-500">Correct</p>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Skill Level: {result.recommendedSkillLevel}
                  </h3>

                  {result.problematicKeys.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Keys to practice:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.problematicKeys.map((key) => (
                          <span
                            key={key}
                            className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-mono"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendedLesson && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Recommended Starting Point:
                      </p>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">
                        {recommendedLesson.title}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {recommendedLesson.description}
                      </p>
                    </div>
                  )}
                </motion.div>

                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/learn')}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Browse All Lessons
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {recommendedLesson && (
                    <button
                      onClick={() => router.push(`/learn/${recommendedLesson.id}`)}
                      className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-4 rounded-xl transition-all duration-200 border-2 border-gray-300 dark:border-gray-600"
                    >
                      Start Recommended Lesson
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {submittingOverlay}
        </div>
      </div>
    );
  };

  return renderContent();
}
