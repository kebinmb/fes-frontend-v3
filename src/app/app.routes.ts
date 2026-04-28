import { Routes } from '@angular/router';
import { LoginComponent } from './core/features/components/login-component/login-component';
import { authGuard } from './utilities/guards/auth/auth-guard';
import { StudentDashboardComponent } from './core/features/components/dashboards/student-dashboard-component/student-dashboard-component';
import { roleGuard } from './utilities/guards/role/role-guard';
import { SupervisorDashboardComponent } from './core/features/components/dashboards/supervisor-dashboard-component/supervisor-dashboard-component';
import { AdminDashboardComponent } from './core/features/components/dashboards/admin-dashboard-component/admin-dashboard-component';
import { EvaluationFormComponent } from './core/features/components/evaluation-form-component/evaluation-form-component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'student-dashboard',
    component: StudentDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_STUDENT' },
  },
  {
    path: 'supervisor-dashboard',
    component: SupervisorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_DEAN' },
  },
  {
    path: 'evaluation-form',
    component: EvaluationFormComponent,
    // canActivate: [authGuard],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' },
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'login',
  },

];
