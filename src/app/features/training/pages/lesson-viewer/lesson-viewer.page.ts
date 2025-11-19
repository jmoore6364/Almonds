import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-lesson-viewer',
  templateUrl: './lesson-viewer.page.html',
  styleUrls: ['./lesson-viewer.page.scss']
})
export class LessonViewerPage implements OnInit {
  moduleId: string = '';
  lessonId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') || '';
    this.lessonId = this.route.snapshot.paramMap.get('lessonId') || '';
  }

  completeLesson() {
    // Mark lesson as complete
    this.router.navigate(['/training', this.moduleId]);
  }
}
