import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { TrainingModule, UserProgress, TrainingStatus, TrainingDifficulty } from '../models/training.model';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  private trainingModulesSubject = new BehaviorSubject<TrainingModule[]>([]);
  public trainingModules$ = this.trainingModulesSubject.asObservable();

  private userProgressSubject = new BehaviorSubject<UserProgress[]>([]);
  public userProgress$ = this.userProgressSubject.asObservable();

  constructor() {
    this.initializeTrainingModules();
  }

  /**
   * Initialize default training modules
   */
  private initializeTrainingModules(): void {
    const modules: TrainingModule[] = [
      {
        id: 'intro-to-cloud',
        title: 'Introduction to Cloud Platforms',
        description: 'Learn the basics of cloud computing and different cloud providers',
        difficulty: TrainingDifficulty.BEGINNER,
        estimatedMinutes: 45,
        lessons: [
          {
            id: 'lesson-1',
            title: 'What is Cloud Computing?',
            content: 'Cloud computing fundamentals...',
            type: 'text',
            orderIndex: 1
          },
          {
            id: 'lesson-2',
            title: 'Understanding IaaS, PaaS, and SaaS',
            content: 'Service models explained...',
            type: 'video',
            orderIndex: 2
          }
        ],
        tags: ['cloud', 'basics', 'beginner']
      },
      {
        id: 'aws-fundamentals',
        title: 'AWS Fundamentals',
        description: 'Get started with Amazon Web Services',
        difficulty: TrainingDifficulty.BEGINNER,
        estimatedMinutes: 90,
        prerequisites: ['intro-to-cloud'],
        lessons: [
          {
            id: 'aws-lesson-1',
            title: 'AWS Console Overview',
            content: 'Navigate the AWS console...',
            type: 'interactive',
            orderIndex: 1
          },
          {
            id: 'aws-lesson-2',
            title: 'EC2 Instances',
            content: 'Creating and managing EC2 instances...',
            type: 'text',
            orderIndex: 2
          }
        ],
        tags: ['aws', 'compute', 'beginner']
      },
      {
        id: 'azure-basics',
        title: 'Azure Basics',
        description: 'Introduction to Microsoft Azure platform',
        difficulty: TrainingDifficulty.BEGINNER,
        estimatedMinutes: 90,
        prerequisites: ['intro-to-cloud'],
        lessons: [
          {
            id: 'azure-lesson-1',
            title: 'Azure Portal Tour',
            content: 'Getting familiar with Azure portal...',
            type: 'video',
            orderIndex: 1
          }
        ],
        tags: ['azure', 'basics', 'beginner']
      },
      {
        id: 'resource-management',
        title: 'Resource Management Best Practices',
        description: 'Learn how to effectively manage cloud resources',
        difficulty: TrainingDifficulty.INTERMEDIATE,
        estimatedMinutes: 60,
        prerequisites: ['intro-to-cloud'],
        lessons: [
          {
            id: 'rm-lesson-1',
            title: 'Tagging Strategies',
            content: 'Effective resource tagging...',
            type: 'text',
            orderIndex: 1
          },
          {
            id: 'rm-lesson-2',
            title: 'Cost Optimization',
            content: 'Managing cloud costs...',
            type: 'interactive',
            orderIndex: 2
          }
        ],
        tags: ['management', 'best-practices', 'intermediate']
      }
    ];

    this.trainingModulesSubject.next(modules);
  }

  /**
   * Get all training modules
   */
  getAllModules(): Observable<TrainingModule[]> {
    return this.trainingModules$;
  }

  /**
   * Get module by ID
   */
  getModuleById(id: string): Observable<TrainingModule | undefined> {
    return of(this.trainingModulesSubject.value.find(m => m.id === id));
  }

  /**
   * Get modules by difficulty
   */
  getModulesByDifficulty(difficulty: TrainingDifficulty): Observable<TrainingModule[]> {
    return of(this.trainingModulesSubject.value.filter(m => m.difficulty === difficulty));
  }

  /**
   * Get user progress for all modules
   */
  getUserProgress(userId: string): Observable<UserProgress[]> {
    return of(this.userProgressSubject.value.filter(p => p.userId === userId));
  }

  /**
   * Start a training module
   */
  startModule(userId: string, moduleId: string): Observable<UserProgress> {
    const progress: UserProgress = {
      userId,
      moduleId,
      status: TrainingStatus.IN_PROGRESS,
      completedLessons: [],
      startedAt: new Date()
    };

    const current = this.userProgressSubject.value;
    this.userProgressSubject.next([...current, progress]);

    return of(progress);
  }

  /**
   * Mark lesson as completed
   */
  completeLesson(userId: string, moduleId: string, lessonId: string): Observable<boolean> {
    const progress = this.userProgressSubject.value;
    const index = progress.findIndex(p => p.userId === userId && p.moduleId === moduleId);

    if (index !== -1) {
      if (!progress[index].completedLessons.includes(lessonId)) {
        progress[index].completedLessons.push(lessonId);
        this.userProgressSubject.next([...progress]);
      }
      return of(true);
    }
    return of(false);
  }

  /**
   * Complete a module
   */
  completeModule(userId: string, moduleId: string, score?: number): Observable<boolean> {
    const progress = this.userProgressSubject.value;
    const index = progress.findIndex(p => p.userId === userId && p.moduleId === moduleId);

    if (index !== -1) {
      progress[index].status = TrainingStatus.COMPLETED;
      progress[index].completedAt = new Date();
      if (score !== undefined) {
        progress[index].score = score;
      }
      this.userProgressSubject.next([...progress]);
      return of(true);
    }
    return of(false);
  }
}
