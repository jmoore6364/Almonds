import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

import { TrainingService } from '@core/services/training.service';
import { TrainingModule, TrainingDifficulty } from '@core/models/training.model';

@Component({
  selector: 'app-training-list',
  templateUrl: './training-list.page.html',
  styleUrls: ['./training-list.page.scss']
})
export class TrainingListPage implements OnInit {
  modules$: Observable<TrainingModule[]>;

  selectedDifficulty: TrainingDifficulty | 'all' = 'all';
  difficulties = Object.values(TrainingDifficulty);

  constructor(
    private router: Router,
    private trainingService: TrainingService
  ) {
    this.modules$ = this.trainingService.getAllModules();
  }

  ngOnInit() {}

  viewModule(module: TrainingModule) {
    this.router.navigate(['/training', module.id]);
  }

  getDifficultyColor(difficulty: TrainingDifficulty): string {
    switch (difficulty) {
      case TrainingDifficulty.BEGINNER:
        return 'success';
      case TrainingDifficulty.INTERMEDIATE:
        return 'warning';
      case TrainingDifficulty.ADVANCED:
        return 'danger';
      default:
        return 'medium';
    }
  }
}
