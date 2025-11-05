'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const FALLBACK_PROMPTS = [
  'Describe a city hidden in the clouds.',
  'The ancient artifact began to glow...',
  'My pet suddenly started talking. It said...',
  'Write about a world where music is illegal.',
  'The last dragon on Earth was just a rumor, until today.',
  'A time traveler arrived, but their machine was broken.',
];

export function PromptDash() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [prompt, setPrompt] = useState('');
  const [text, setText] = useState('');
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const incrementGamesPlayed = useGameStore((s) => s.incrementGamesPlayed);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const previousFeedback = useGameStore((s) => s.lastWritingFeedback['prompt-dash'] || null);
  const setWritingFeedback = useGameStore((s) => s.setWritingFeedback);
  const highScore = useGameStore((s) => s.highScores['prompt-dash'] || 0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const generateWritingFeedback = useCallback(
    async (writtenText: string, priorFeedback: string | null) => {
      const cleaned = writtenText.trim();
      if (!cleaned) {
        setAiFeedback('Add more writing next time to unlock personalized feedback.');
        setWritingFeedback('prompt-dash', null);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      if (!apiKey) {
        console.error(
          'Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is not set in environment variables.'
        );
        setAiFeedback(
          'Could not connect to the AI coach. Add an API key to receive writing guidance.'
        );
        setWritingFeedback('prompt-dash', null);
        return;
      }

      setIsFeedbackLoading(true);

      try {
        const systemPrompt = `You are a supportive creative-writing coach for a typing practice game. Offer precise, encouraging feedback (2-3 sentences) about the user's writing style, tone, vocabulary, and clarity.
If prior feedback is provided, compare the current writing to that guidance and highlight any progress or areas that still need work.`;

        const userQuery = priorFeedback
          ? `Previous feedback you (the coach) gave:
${priorFeedback}

Current writing sample:
${cleaned}

Provide updated feedback that references progress relative to the earlier guidance.`
          : `Current writing sample:
${cleaned}

Provide fresh feedback focused on writing style, tone, word choice, and narrative clarity.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemPrompt}\n\n${userQuery}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 220,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch writing feedback');
        }

        const data = await response.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (feedback) {
          setAiFeedback(feedback);
          setWritingFeedback('prompt-dash', feedback);
        } else {
          setAiFeedback('The AI coach could not generate feedback this round. Try another prompt.');
          setWritingFeedback('prompt-dash', null);
        }
      } catch (error) {
        console.error('Error generating writing feedback:', error);
        setAiFeedback('Something went wrong while generating feedback. Please try again later.');
      } finally {
        setIsFeedbackLoading(false);
      }
    },
    [setWritingFeedback]
  );

  const generateNewPrompt = async () => {
    setIsLoading(true);
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      console.error(
        'Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is not set in environment variables.'
      );
      // Use fallback prompt
      setPrompt(FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Generate a single creative writing prompt for a typing speed game. The prompt should be engaging, imaginative, and inspire creative writing. It should be 1-2 sentences long. Examples: "Describe a city hidden in the clouds." or "The ancient artifact began to glow..." Return ONLY the prompt text, nothing else.',
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 100,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      const generatedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (generatedPrompt) {
        setPrompt(generatedPrompt);
      } else {
        // Fallback if no prompt generated
        setPrompt(FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      // Use fallback on error
      setPrompt(FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)]);
    } finally {
      setIsLoading(false);
    }
  };

  const startGame = async () => {
    await generateNewPrompt();
    setText('');
    setTimer(60);
    setScore(0);
    setGameState('running');
    setAiFeedback(null);
    setIsFeedbackLoading(false);
    textAreaRef.current?.focus();
  };

  const stopGame = () => {
    setGameState('finished');
    // Calculate WPM: (all characters / 5) / (1 minute)
    const wordsTyped = text.length / 5;
    const wpm = Math.round(wordsTyped);
    setScore(wpm);
    if (wpm > highScore) {
      setHighScore('prompt-dash', wpm);
    }
    incrementGamesPlayed('prompt-dash');
    generateWritingFeedback(text, previousFeedback);
  };

  useEffect(() => {
    if (gameState === 'running') {
      textAreaRef.current?.focus();
      timerInterval.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerInterval.current!);
            stopGame();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [gameState]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Time's Up!</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Your WPM</p>
          <p className="text-5xl font-bold text-primary mb-4">{score}</p>
          <p className="text-sm text-muted-foreground">High Score: {highScore} WPM</p>
        </div>
        {(isFeedbackLoading || aiFeedback) && (
          <div className="w-full mb-8 bg-background/40 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-[var(--theme-primary)]" />
              <span className="font-semibold">AI Writing Coach</span>
            </div>
            {isFeedbackLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reviewing your writing...</span>
              </div>
            ) : aiFeedback ? (
              <p className="text-sm leading-relaxed text-foreground">{aiFeedback}</p>
            ) : null}
          </div>
        )}
        <div className="flex gap-4">
          <Button onClick={startGame} size="lg">
            Play Again
          </Button>
          <Button onClick={() => setCurrentGame(null)} variant="outline" size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Games
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
      {gameState === 'idle' ? (
        <>
          <h2 className="text-2xl font-bold mb-4">Prompt Dash</h2>
          <ul className="list-disc list-inside text-muted-foreground mb-6 text-left space-y-2">
            <li>A creative writing prompt will be shown.</li>
            <li>
              You have <strong>60 seconds</strong> to write a story based on it.
            </li>
            <li>
              Your score is your final <strong>Words Per Minute (WPM)</strong>.
            </li>
            <li>After the game, you'll get AI feedback on your writing!</li>
          </ul>
          <Button onClick={startGame} size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Prompt...
              </>
            ) : (
              'Start Game'
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center w-full mb-4">
            <div className="flex items-center gap-2 text-xl font-bold text-primary">
              <Timer />
              <span>{timer}s</span>
            </div>
            <div className="text-xl font-bold">
              WPM: {Math.round(text.length / 5 / ((60 - timer) / 60) || 0)}
            </div>
          </div>
          <p className="text-lg text-muted-foreground italic mb-4 p-4 bg-background/50 rounded-md w-full text-center">
            "{prompt}"
          </p>
          <textarea
            ref={textAreaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-64 p-4 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Start writing..."
          />
        </>
      )}
    </div>
  );
}
