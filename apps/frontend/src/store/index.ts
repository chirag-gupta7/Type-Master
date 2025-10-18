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
    const { textToType } = get();

    // Don't allow input beyond the text length
    if (input.length > textToType.length) {
      return;
    }

    const calculateWPMAndAccuracy = (state: TypingState) => {
      // Do not calculate if the test is not in progress.
      if (!state.startTime || state.status !== 'in-progress') {
        return { wpm: 0, accuracy: 100, errors: 0 };
      }

      // Calculate elapsed time in minutes. This is the denominator for WPM.
      const elapsed = (Date.now() - state.startTime) / 1000 / 60;
      if (elapsed === 0) {
        return { wpm: 0, accuracy: 100, errors: 0 }; // Avoid division by zero.
      }

      const typedChars = state.userInput.length;
      let correctChars = 0;
      let errors = 0;

      // Iterate only over the characters the user has typed so far.
      for (let i = 0; i < typedChars; i++) {
        if (state.userInput[i] === state.textToType[i]) {
          correctChars++;
        } else {
          errors++;
        }
      }

      // WPM is calculated based on the standard of 5 characters per word.
      // This is the Gross WPM, based on all correctly typed characters.
      const wpm = Math.round(correctChars / 5 / elapsed);

      // Accuracy is the percentage of correctly typed characters out of all typed characters.
      const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100;

      return { wpm, accuracy, errors };
    };

    const { wpm, accuracy, errors } = calculateWPMAndAccuracy(get());
    set({ userInput: input, wpm, accuracy, errors });

    // Auto-finish if user completes the text
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
