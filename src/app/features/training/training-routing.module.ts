import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TrainingListPage } from './pages/training-list/training-list.page';
import { TrainingDetailPage } from './pages/training-detail/training-detail.page';
import { LessonViewerPage } from './pages/lesson-viewer/lesson-viewer.page';

const routes: Routes = [
  {
    path: '',
    component: TrainingListPage
  },
  {
    path: ':moduleId',
    component: TrainingDetailPage
  },
  {
    path: ':moduleId/lesson/:lessonId',
    component: LessonViewerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TrainingRoutingModule {}
