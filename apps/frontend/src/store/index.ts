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
    const { textToType, startTime } = get();

    // Don't allow input beyond the text length
    if (input.length > textToType.length) {
      return;
    }

    const currentErrors = calculateErrors(input, textToType);
    const currentTime = Date.now();
    const timeElapsed = startTime ? (currentTime - startTime) / 1000 / 60 : 0; // in minutes

    // Calculate real-time WPM and accuracy
    const currentWPM = calculateWPM(input.length, currentErrors, timeElapsed);
    const currentAccuracy = calculateAccuracy(input.length, currentErrors);

    set({
      userInput: input,
      errors: currentErrors,
      wpm: currentWPM,
      accuracy: currentAccuracy,
    });

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
