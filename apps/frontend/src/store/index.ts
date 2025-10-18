import { create } from 'zustand';

interface TypingTestState {
  status: 'waiting' | 'in-progress' | 'finished';
  textToType: string;
  userInput: string;
  startTime: number | null;
  endTime: number | null;
  errors: number;
  wpm: number;
  accuracy: number;
  duration: 30 | 60 | 180;
}

interface TypingTestActions {
  startTest: (text: string, duration: 30 | 60 | 180) => void;
  setUserInput: (input: string) => void;
  endTest: () => void;
  resetTest: () => void;
}

type TypingTestStore = TypingTestState & TypingTestActions;

const initialState: TypingTestState = {
  status: 'waiting',
  textToType: '',
  userInput: '',
  startTime: null,
  endTime: null,
  errors: 0,
  wpm: 0,
  accuracy: 100,
  duration: 60,
};

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

export const useTypingTestStore = create<TypingTestStore>((set, get) => ({
  ...initialState,

  /**
   * Initialize a new typing test
   */
  startTest: (text: string, duration: 30 | 60 | 180) => {
    set({
      status: 'in-progress',
      textToType: text,
      userInput: '',
      startTime: Date.now(),
      endTime: null,
      errors: 0,
      wpm: 0,
      accuracy: 100,
      duration,
    });
  },

  /**
   * Update user input and calculate errors in real-time
   */
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

  /**
   * End the test and calculate final metrics
   */
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

  /**
   * Reset the test to initial state
   */
  resetTest: () => {
    set(initialState);
  },
}));
