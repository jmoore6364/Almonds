import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { TrainingService } from '@core/services/training.service';
import { TrainingModule, Lesson } from '@core/models/training.model';

@Component({
  selector: 'app-training-detail',
  templateUrl: './training-detail.page.html',
  styleUrls: ['./training-detail.page.scss']
})
export class TrainingDetailPage implements OnInit {
  moduleId: string = '';
  module$?: Observable<TrainingModule | undefined>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private trainingService: TrainingService
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') || '';
    if (this.moduleId) {
      this.module$ = this.trainingService.getModuleById(this.moduleId);
    }
  }

  startModule() {
    // In a real app, this would track user progress
    console.log('Starting module:', this.moduleId);
  }

  viewLesson(lesson: Lesson) {
    this.router.navigate(['/training', this.moduleId, 'lesson', lesson.id]);
  }

  getLessonIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'text': 'document-text-outline',
      'video': 'videocam-outline',
      'interactive': 'code-slash-outline',
      'quiz': 'help-circle-outline'
    };
    return icons[type] || 'document-outline';
  }
}
