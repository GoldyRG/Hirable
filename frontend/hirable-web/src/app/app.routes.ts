import { Routes } from '@angular/router';
import { JobApplicationsListComponent } from './features/job-applications-list/job-applications-list.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { JobBoardComponent } from './features/job-board/job-board.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full'
  },
  {
    path: 'jobs',
    component: JobApplicationsListComponent
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: LoginComponent
  },
  {
    path: 'job-board',
    component: JobBoardComponent
  },
  {
    path: 'register',
    component: LoginComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
