// Achievement types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Can be any string from backend
  points: number;
  requirement: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementStats {
  totalAchievements: number;
  unlockedCount: number;
  lockedCount: number;
  completionPercentage: number;
  totalPoints: number;
  earnedPoints: number;
  pointsPercentage: number;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Can be any string from backend
  points: number;
  unlockedAt: string;
}

// Progress Visualization types
export interface LevelCompletion {
  level: string;
  name: string;
  percentage: number;
  completed: number;
  total: number;
  stars: number;
  maxStars: number;
}

export interface WPMDataPoint {
  date: string;
  wpm: number;
  accuracy: number;
}

export interface LessonWPMData {
  lessonId: string;
  lessonTitle: string;
  level: number;
  data: WPMDataPoint[];
}

export interface PracticeDay {
  date: string;
  count: number;
}

export interface SkillTreeNode {
  id: string;
  title: string;
  level: number;
  order: number;
  difficulty: string;
  targetWpm: number;
  completed: boolean;
  stars: number;
  bestWpm: number;
  attempts: number;
  locked: boolean;
  prerequisites: string[];
}

export interface ProgressVisualizationData {
  completionByLevel: LevelCompletion[];
  wpmByLesson: LessonWPMData[];
  practiceFrequency: PracticeDay[];
  skillTree: SkillTreeNode[];
}
