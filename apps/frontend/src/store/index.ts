import { create } from 'zustand';
import { generateTestText } from '@/lib/textGenerator';

// Re-export theme store
export * from './theme';

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
  generateAndStartTest: (duration: 30 | 60 | 180, category?: string) => void;
  startTimer: () => void;
  setUserInput: (input: string) => void;
  endTest: () => void;
  resetTest: (preserveText?: boolean) => void;
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

  generateAndStartTest: (duration: 30 | 60 | 180, category?: string) => {
    const text = generateTestText(
      duration,
      category as 'tech' | 'literature' | 'general' | 'business' | 'science' | undefined
    );
    get().startTest(text);
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

    // Sanitize input: replace newlines with spaces and collapse multiple spaces
    const sanitizedInput = input.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');

    // Prevent input from exceeding the text length
    if (sanitizedInput.length > textToType.length) {
      return;
    }

    // Start the timer on the very first character typed
    let nextStartTime = startTime;
    let nextStatus = status;
    if (!nextStartTime && sanitizedInput.length > 0) {
      nextStartTime = Date.now();
      nextStatus = 'in-progress';
    }

    let wpm = 0;
    let accuracy = 100;
    let errors = 0;

    // Calculate real-time metrics if test has started
    if (nextStartTime && sanitizedInput.length > 0) {
      const elapsedMinutes = Math.max(0.01, (Date.now() - nextStartTime) / 1000 / 60); // Min 0.01 to prevent division by zero
      const typedChars = sanitizedInput.length;

      // Calculate character-by-character accuracy
      let correctChars = 0;
      for (let i = 0; i < typedChars; i++) {
        if (sanitizedInput[i] === textToType[i]) {
          correctChars++;
        }
      }

      // Calculate errors and accuracy
      errors = typedChars - correctChars;
      accuracy = Math.round((correctChars / typedChars) * 100);
      accuracy = Math.max(0, Math.min(100, accuracy));

      // Calculate WPM using industry-standard formula
      // Gross WPM = (total characters typed / 5) / time in minutes
      const grossWPM = typedChars / 5 / elapsedMinutes;
      // Net WPM = Gross WPM - (errors / time in minutes)
      const netWPM = grossWPM - errors / elapsedMinutes;
      wpm = Math.max(0, Math.round(netWPM));
    }

    set({
      userInput: sanitizedInput,
      startTime: nextStartTime,
      status: nextStatus,
      wpm,
      accuracy,
      errors,
    });

    // Auto-complete test when full text is typed
    if (sanitizedInput.length === textToType.length) {
      get().endTest();
    }
  },

  endTest: () => {
    const { userInput, textToType, startTime } = get();
    const endTime = Date.now();

    if (!startTime) return;

    // Ensure minimum time of 1 second to prevent unrealistic WPM calculations
    const timeInMinutes = Math.max(1 / 60, (endTime - startTime) / 1000 / 60);
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

  resetTest: (preserveText = false) => {
    const currentText = preserveText ? get().textToType : '';
    set({
      status: 'waiting',
      textToType: currentText,
      userInput: '',
      startTime: null,
      endTime: null,
      errors: 0,
      wpm: 0,
      accuracy: 100,
    });
  },
}));
