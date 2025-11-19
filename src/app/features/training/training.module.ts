import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

import { TrainingRoutingModule } from './training-routing.module';
import { TrainingListPage } from './pages/training-list/training-list.page';
import { TrainingDetailPage } from './pages/training-detail/training-detail.page';
import { LessonViewerPage } from './pages/lesson-viewer/lesson-viewer.page';

@NgModule({
  declarations: [
    TrainingListPage,
    TrainingDetailPage,
    LessonViewerPage
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrainingRoutingModule
  ]
})
export class TrainingModule {}
