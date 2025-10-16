// User types
export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  totalTests: number;
}

// Auth types
export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

// Test types
export type TestMode = 'WORDS' | 'TIME' | 'QUOTE';
export type TestDuration = 30 | 60 | 180;

export interface TestResult {
  id: string;
  userId: string;
  wpm: number;
  accuracy: number;
  rawWpm: number;
  errors: number;
  duration: TestDuration;
  mode: TestMode;
  createdAt: string;
}

export interface CreateTestResultRequest {
  wpm: number;
  accuracy: number;
  rawWpm: number;
  errors: number;
  duration: TestDuration;
  mode?: TestMode;
}

export interface TestStats {
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  totalTests: number;
  recentTests: Array<{
    wpm: number;
    accuracy: number;
    createdAt: string;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Typing test state
export interface TypingTestState {
  text: string;
  input: string;
  startTime: number | null;
  endTime: number | null;
  duration: TestDuration;
  isActive: boolean;
  isCompleted: boolean;
  errors: number;
  currentIndex: number;
}

// Stats and analytics
export interface DashboardStats {
  totalTests: number;
  averageWpm: number;
  averageAccuracy: number;
  bestWpm: number;
  bestAccuracy: number;
  recentTests: TestResult[];
  progressData: Array<{
    date: string;
    wpm: number;
    accuracy: number;
  }>;
}
