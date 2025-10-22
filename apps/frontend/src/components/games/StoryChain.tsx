'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/games';
import { Button } from '@/components/ui/button';
import { Timer, CornerDownLeft, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

const FALLBACK_STARTERS = [
  'The dusty old book fell from the shelf, opening to a strange map.',
  'A single red light blinked on the abandoned console.',
  'The alley was empty, except for a cat with unusual green eyes.',
];
const FALLBACK_RESPONSES = [
  'Suddenly, a loud noise echoed from the floor above.',
  'But they had a strange feeling they were being watched.',
  'It was unlike anything they had ever seen before.',
  'A hidden door creaked open in the shadows.',
  'They knew at that moment, nothing would be the same.',
];

export function StoryChain() {
  const [gameState, setGameState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [story, setStory] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');
  const [timer, setTimer] = useState(180);
  const [score, setScore] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const setHighScore = useGameStore((s) => s.setHighScore);
  const incrementGamesPlayed = useGameStore((s) => s.incrementGamesPlayed);
  const setCurrentGame = useGameStore((s) => s.setCurrentGame);
  const previousFeedback = useGameStore((s) => s.lastWritingFeedback['story-chain'] || null);
  const setWritingFeedback = useGameStore((s) => s.setWritingFeedback);
  const highScore = useGameStore((s) => s.highScores['story-chain'] || 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const storyEndRef = useRef<HTMLDivElement>(null);

  const generateWritingFeedback = useCallback(
    async (storySentences: string[], priorFeedback: string | null) => {
      const userSentences = storySentences.filter((_, index) => index % 2 === 1);
      const combined = userSentences.join(' ').trim();

      if (!combined) {
        setAiFeedback('Add more of your story next time to unlock detailed guidance.');
        setWritingFeedback('story-chain', null);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
      if (!apiKey) {
        console.error(
          'Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is not set in environment variables.'
        );
        setAiFeedback(
          'Connect an AI key to receive narrative feedback on your story contributions.'
        );
        setWritingFeedback('story-chain', null);
        return;
      }

      setIsFeedbackLoading(true);

      try {
        const systemPrompt = `You are a collaborative storytelling coach analyzing a user's contributions in a game called Story Chain. Highlight the user's narrative voice, pacing, tone, and how well they build on prior sentences.
If you are given earlier feedback that you provided, compare the new writing with that guidance and point out improvements or persistent issues.`;

        const userQuery = priorFeedback
          ? `Previous advice you gave the user:
${priorFeedback}

User's current sentences (only their contributions):
${combined}

Provide updated feedback referencing progress relative to the earlier advice.`
          : `User's current sentences in the collaborative story:
${combined}

Provide fresh feedback focused on storytelling style, creativity, tone, and clarity.`;

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
                maxOutputTokens: 250,
              },
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch story feedback');
        }

        const data = await response.json();
        const feedback = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (feedback) {
          setAiFeedback(feedback);
          setWritingFeedback('story-chain', feedback);
        } else {
          setAiFeedback('The storytelling coach could not review this round. Try another story.');
          setWritingFeedback('story-chain', null);
        }
      } catch (error) {
        console.error('Error generating story feedback:', error);
        setAiFeedback('Something went wrong while generating feedback. Please try again later.');
      } finally {
        setIsFeedbackLoading(false);
      }
    },
    [setWritingFeedback]
  );

  const getAiResponse = async (currentStory: string[]): Promise<string> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey) {
      console.error(
        'Gemini API key (NEXT_PUBLIC_GEMINI_API_KEY) is not set in environment variables.'
      );
      // Use fallback
      if (currentStory.length === 0) {
        return FALLBACK_STARTERS[Math.floor(Math.random() * FALLBACK_STARTERS.length)];
      }
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }

    try {
      const isFirstSentence = currentStory.length === 0;
      const systemPrompt = isFirstSentence
        ? 'You are starting a collaborative story in a typing game. Generate an engaging opening sentence that sets up an interesting scenario or mystery. Keep it to a single, concise sentence. Do not add any preamble. Just write the sentence.'
        : `You are a creative and engaging storyteller collaborating with a user in a typing game called Story Chain.
The user provides a sentence, and your task is to write the *very next* sentence to continue the narrative smoothly and interestingly.
Focus on building upon the user's last sentence. Be imaginative but keep the story coherent.
IMPORTANT: Your response MUST be only a single sentence. Do NOT add any introductory phrases like "Okay, here's the next part:", "Continuing the story:", or any other text outside the single story sentence. Just provide the next sentence directly.`;

      const userQuery = isFirstSentence
        ? 'Write an engaging opening sentence for a story.'
        : `Here is the story so far:\n${currentStory.join('\n')}\n\nWrite the next single sentence to continue this story based *specifically* on the last sentence written.`;

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
              temperature: 0.8,
              maxOutputTokens: 150,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiSentence = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (aiSentence) {
        return aiSentence;
      }

      // Fallback if no response
      if (isFirstSentence) {
        return FALLBACK_STARTERS[Math.floor(Math.random() * FALLBACK_STARTERS.length)];
      }
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Fallback on error
      if (currentStory.length === 0) {
        return FALLBACK_STARTERS[Math.floor(Math.random() * FALLBACK_STARTERS.length)];
      }
      return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
    }
  };

  const startGame = async () => {
    setIsStarting(true);
    const firstSentence = await getAiResponse([]);
    setStory([firstSentence]);
    setUserInput('');
    setTimer(180);
    setScore(0);
    setGameState('running');
    setAiFeedback(null);
    setIsFeedbackLoading(false);
    setIsStarting(false);
  };

  const stopGame = () => {
    setGameState('finished');
    if (score > highScore) {
      setHighScore('story-chain', score);
    }
    incrementGamesPlayed('story-chain');
    generateWritingFeedback(story, previousFeedback);
  };

  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userInput.trim() || isAiThinking) return;

    const newUserSentence = userInput.trim();
    setUserInput('');
    setIsAiThinking(true);

    // Get AI response
    const aiResponse = await getAiResponse([...story, newUserSentence]);

    setStory([...story, newUserSentence, aiResponse]);
    setScore(score + 1);
    setIsAiThinking(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (gameState === 'running') {
      inputRef.current?.focus();
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

  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [story]);

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center p-6 bg-card rounded-lg shadow-lg w-full max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Story Complete!</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-2">Sentences Added</p>
          <p className="text-5xl font-bold text-primary mb-4">{score}</p>
          <p className="text-sm text-muted-foreground">High Score: {highScore} sentences</p>
        </div>
        {(isFeedbackLoading || aiFeedback) && (
          <div className="w-full mb-8 bg-background/40 border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-[var(--theme-primary)]" />
              <span className="font-semibold">AI Story Coach</span>
            </div>
            {isFeedbackLoading ? (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reviewing your story contributions...</span>
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
          <h2 className="text-2xl font-bold mb-4">Story Chain</h2>
          <p className="text-muted-foreground mb-6 text-center">
            Write a story one sentence at a time, alternating with an AI. See how many sentences you
            can add in 3 minutes!
          </p>
          <Button onClick={startGame} size="lg" disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is starting the story...
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
            <div className="text-xl font-bold">Your Sentences: {score}</div>
          </div>
          <div className="w-full h-64 overflow-y-auto p-4 bg-background/50 rounded-md mb-4 flex flex-col gap-2">
            {story.map((sentence, index) => (
              <p
                key={index}
                className={
                  index % 2 === 0 ? 'text-muted-foreground' : 'text-foreground font-medium'
                }
              >
                {index % 2 === 0 ? 'AI: ' : 'You: '}
                {sentence}
              </p>
            ))}
            {isAiThinking && (
              <p className="text-muted-foreground italic flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI is thinking...
              </p>
            )}
            <div ref={storyEndRef} />
          </div>
          <form onSubmit={handleUserSubmit} className="w-full flex gap-2">
            <input
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isAiThinking}
              className="flex-grow p-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={isAiThinking ? 'AI is writing...' : 'Type the next sentence...'}
            />
            <Button type="submit" size="icon" aria-label="Submit sentence" disabled={isAiThinking}>
              <CornerDownLeft />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
