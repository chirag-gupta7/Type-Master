'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Clock, Target, TrendingUp, Award, ArrowRight, Loader2 } from 'lucide-react';

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

export default function AssessmentPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'intro' | 'testing' | 'results'>('intro');
  const [testContent, setTestContent] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [recommendedLesson, setRecommendedLesson] = useState<RecommendedLesson | null>(null);
  const [feedback, setFeedback] = useState('');

  // Fetch assessment content on mount
  useEffect(() => {
    const fetchAssessmentContent = async () => {
      try {
        // For now, use demo user ID - replace with actual auth later
        const userId = 'demo-user-id';

        const response = await fetch('http://localhost:5000/api/v1/assessment/start', {
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
    setIsLoading(true);

    const timeSpent = (endTime - startTime) / 1000; // seconds
    const totalChars = testContent.length;
    const correctChars =
      totalChars - Object.values(mistakes).reduce((a, b) => a + b, 0) - (lastCharCorrect ? 0 : 1);
    const accuracy = (correctChars / totalChars) * 100;
    const wpm = totalChars / 5 / (timeSpent / 60); // Standard WPM calculation

    try {
      const userId = 'demo-user-id'; // Replace with actual auth

      const response = await fetch('http://localhost:5000/api/v1/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          wpm: Math.round(wpm),
          accuracy: Math.round(accuracy * 10) / 10,
          mistakesByKey: mistakes,
          weakFingers: [], // Could be determined client-side based on key positions
          timeSpent,
        }),
      });

      const data = await response.json();
      setResult(data.assessment);
      setRecommendedLesson(data.recommendedLesson);
      setFeedback(data.feedback);
      setStage('results');
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCharStatus = (index: number) => {
    if (index >= userInput.length) return 'pending';
    if (userInput[index] === testContent[index]) return 'correct';
    return 'incorrect';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
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

        {isLoading && (
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
        )}
      </div>
    </div>
  );
}
