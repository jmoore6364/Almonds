export enum TrainingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum TrainingDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  difficulty: TrainingDifficulty;
  estimatedMinutes: number;
  lessons: Lesson[];
  prerequisites?: string[];
  tags: string[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'interactive' | 'quiz';
  orderIndex: number;
  completed?: boolean;
}

export interface UserProgress {
  userId: string;
  moduleId: string;
  status: TrainingStatus;
  completedLessons: string[];
  startedAt: Date;
  completedAt?: Date;
  score?: number;
}
