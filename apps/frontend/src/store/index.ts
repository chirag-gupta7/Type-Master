import { create } from 'zustand';

interface TypingState {
  status: 'waiting' | 'in-progress' | 'finished';
  textToType: string;
  userInput: string;
  startTime: number | null;
  endTime: number | null;
  errors: number;
  wpm: number;
  accuracy: number;
  startTest: (text: string) => void;
  startTimer: () => void;
  setUserInput: (input: string) => void;
  endTest: () => void;
  resetTest: () => void;
}

/**
 * Calculate the number of errors between user input and expected text
 */
const calculateErrors = (userInput: string, textToType: string): number => {
  let errorCount = 0;
  const minLength = Math.min(userInput.length, textToType.length);

  for (let i = 0; i < minLength; i++) {
    if (userInput[i] !== textToType[i]) {
      errorCount++;
    }
  }

  return errorCount;
};

/**
 * Calculate Words Per Minute
 * Formula: ((totalCharsTyped / 5) - uncorrectedErrors) / timeInMinutes
 */
const calculateWPM = (
  totalCharsTyped: number,
  uncorrectedErrors: number,
  timeInMinutes: number
): number => {
  if (timeInMinutes === 0) return 0;

  const grossWPM = totalCharsTyped / 5 / timeInMinutes;
  const netWPM = grossWPM - uncorrectedErrors / timeInMinutes;

  return Math.max(0, Math.round(netWPM));
};

/**
 * Calculate Accuracy Percentage
 * Formula: ((totalCharsTyped - totalErrors) / totalCharsTyped) * 100
 */
const calculateAccuracy = (totalCharsTyped: number, totalErrors: number): number => {
  if (totalCharsTyped === 0) return 100;

  const accuracy = ((totalCharsTyped - totalErrors) / totalCharsTyped) * 100;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10)); // Round to 1 decimal
};

export const useTypingStore = create<TypingState>((set, get) => ({
  status: 'waiting',
  textToType: '',
  userInput: '',
  startTime: null,
  endTime: null,
  errors: 0,
  wpm: 0,
  accuracy: 100,

  startTest: (text: string) => {
    set({
      textToType: text,
      status: 'waiting',
      startTime: null,
      userInput: '',
      errors: 0,
      wpm: 0,
      accuracy: 100,
    });
  },

  startTimer: () => {
    set({
      startTime: Date.now(),
      status: 'in-progress',
    });
  },

  setUserInput: (input: string) => {
    const state = get();
    const { textToType, status, startTime } = state;

    if (input.length > textToType.length) {
      return;
    }

    // FIX: Start the timer and mark the run as in-progress on the very first character.
    let nextStartTime = startTime;
    let nextStatus = status;
    if (!nextStartTime && input.length > 0) {
      nextStartTime = Date.now();
      nextStatus = 'in-progress';
    }

    let wpm = 0;
    let accuracy = 100;
    let errors = 0;

    if (nextStartTime) {
      const elapsedMinutes = (Date.now() - nextStartTime) / 1000 / 60;
      const typedChars = input.length;

      if (typedChars > 0) {
        let correctChars = 0;
        for (let i = 0; i < typedChars; i++) {
          if (input[i] === textToType[i]) {
            correctChars++;
          }
        }

        errors = typedChars - correctChars;
        accuracy = Math.max(0, Math.min(100, Math.round((correctChars / typedChars) * 100)));

        if (elapsedMinutes > 0) {
          // FIX: WPM should track gross speed (all characters typed) to avoid under-reporting.
          const wordsPerMinute = typedChars / 5 / elapsedMinutes;
          wpm = Math.max(0, Math.round(wordsPerMinute));
        }
      }
    }

    set({
      userInput: input,
      startTime: nextStartTime,
      status: nextStatus,
      wpm,
      accuracy,
      errors,
    });

    if (input.length === textToType.length) {
      get().endTest();
    }
  },

  endTest: () => {
    const { userInput, textToType, startTime } = get();
    const endTime = Date.now();

    if (!startTime) return;

    const timeInMinutes = (endTime - startTime) / 1000 / 60;
    const totalCharsTyped = userInput.length;
    const totalErrors = calculateErrors(userInput, textToType);

    const finalWPM = calculateWPM(totalCharsTyped, totalErrors, timeInMinutes);
    const finalAccuracy = calculateAccuracy(totalCharsTyped, totalErrors);

    set({
      status: 'finished',
      endTime,
      wpm: finalWPM,
      accuracy: finalAccuracy,
      errors: totalErrors,
    });
  },

  resetTest: () => {
    set({
      status: 'waiting',
      textToType: '',
      userInput: '',
      startTime: null,
      endTime: null,
      errors: 0,
      wpm: 0,
      accuracy: 100,
    });
  },
}));
