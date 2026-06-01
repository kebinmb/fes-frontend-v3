import { Routes } from '@angular/router';
import { LoginComponent } from './core/features/components/login-component/login-component';
import { authGuard } from './utilities/guards/auth/auth-guard';
import { StudentDashboardComponent } from './core/features/components/dashboards/student-dashboard-component/student-dashboard-component';
import { roleGuard } from './utilities/guards/role/role-guard';
import { SupervisorDashboardComponent } from './core/features/components/dashboards/supervisor-dashboard-component/supervisor-dashboard-component';
import { AdminDashboardComponent } from './core/features/components/dashboards/admin-dashboard-component/admin-dashboard-component';
import { EvaluationFormComponent } from './core/features/components/evaluation-form-component/evaluation-form-component';
import { LoginAdminComponent } from './core/features/components/login-admin-component/login-admin-component';
import { FacultyDataTableComponent } from './core/features/components/faculty-data-table-component/faculty-data-table-component';
import { FacultyEvaluationScoresDataTableComponent } from './core/features/components/faculty-evaluation-scores-data-table-component/faculty-evaluation-scores-data-table-component';
import { UserAccountsDataTableComponent } from './core/features/components/user-accounts-data-table-component/user-accounts-data-table-component';
import { guestGuard } from './utilities/guards/guest/guest-guard';
import { SettingsComponent } from './core/features/components/settings-component/settings-component';
import { OauthSuccessComponent } from './shared/components/oauth-success-component/oauth-success-component';
import { StudentEvaluationsDataTableComponent } from './core/features/components/student-evaluations-data-table/student-evaluations-data-table-component';
import { FacultyEvaluationPrintComponent } from './shared/components/faculty-evaluation-print-component/faculty-evaluation-print-component';
import { StudentEvaluationListComponent } from './core/features/components/student-evaluation-list-component/student-evaluation-list-component';
import { StudentEvaluationListPrintComponent } from './shared/components/student-evaluation-list-print-component/student-evaluation-list-print-component';

export const routes: Routes = [
  {
    path: 'oauth-success',
    component: OauthSuccessComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    component: LoginAdminComponent,
    canActivate: [guestGuard],
  },
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
    data: { role: ['ROLE_DEAN', 'ROLE_PROGRAM_CHAIR'] }
  },
  {
    path: 'evaluation-form',
    component: EvaluationFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' },
    children: [
      { path: 'faculty-list', component: FacultyDataTableComponent },
      { path: 'evaluation-score-list', component: FacultyEvaluationScoresDataTableComponent },
      { path: 'user-accounts', component: UserAccountsDataTableComponent },
      { path: 'student-evaluations', component: StudentEvaluationsDataTableComponent },
      { path: 'student-evaluation-list', component: StudentEvaluationListComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
  {
    path: 'print/faculty-evaluation',
    component: FacultyEvaluationPrintComponent,
  },
  {
    path: 'print/student-evaluation',

    component: StudentEvaluationListPrintComponent,
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
