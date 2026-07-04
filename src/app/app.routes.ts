import { Routes } from '@angular/router';
import { authGuard } from '@utilities/guards/auth/auth-guard';
import { guestGuard } from '@utilities/guards/guest/guest-guard';
import { roleGuard } from '@utilities/guards/role/role-guard';

export const routes: Routes = [
  {
    path: 'oauth-success',
    loadComponent: () =>
      import('@shared/components/oauth-success-component/oauth-success-component').then(
        (m) => m.OauthSuccessComponent,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('@features/auth/login/login-component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('@features/auth/login-admin/login-admin-component').then(
        (m) => m.LoginAdminComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'student-dashboard',
    loadComponent: () =>
      import('@features/student/pages/student-dashboard/student-dashboard-component').then(
        (m) => m.StudentDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_STUDENT' },
  },
  {
    path: 'supervisor-dashboard',
    loadComponent: () =>
      import(
        '@features/supervisor/pages/supervisor-dashboard/supervisor-dashboard-component'
      ).then((m) => m.SupervisorDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: ['ROLE_DEAN', 'ROLE_PROGRAM_CHAIR'] },
  },
  {
    path: 'evaluation-form',
    loadComponent: () =>
      import('@features/evaluation/pages/evaluation-form/evaluation-form-component').then(
        (m) => m.EvaluationFormComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('@features/admin/pages/admin-dashboard/admin-dashboard-component').then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' },
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            '@features/admin/components/admin-dashboard-overview/admin-dashboard-overview-component'
          ).then((m) => m.AdminDashboardOverviewComponent),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            '@features/admin/components/admin-dashboard-overview/admin-dashboard-overview-component'
          ).then((m) => m.AdminDashboardOverviewComponent),
      },
      {
        path: 'faculty-list',
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-data-table/faculty-data-table-component'
          ).then((m) => m.FacultyDataTableComponent),
      },
      {
        path: 'faculty-workloads',
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-workload/faculty-workload-component'
          ).then((m) => m.FacultyWorkloadComponent),
      },
      {
        path: 'evaluation-score-list',
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-evaluation-scores-data-table/faculty-evaluation-scores-data-table-component'
          ).then((m) => m.FacultyEvaluationScoresDataTableComponent),
      },
      {
        path: 'user-accounts',
        loadComponent: () =>
          import(
            '@features/admin/components/user-accounts-data-table/user-accounts-data-table-component'
          ).then((m) => m.UserAccountsDataTableComponent),
      },
      {
        path: 'student-evaluations',
        loadComponent: () =>
          import(
            '@features/admin/components/student-evaluations-data-table/student-evaluations-data-table-component'
          ).then((m) => m.StudentEvaluationsDataTableComponent),
      },
      {
        path: 'student-evaluation-list',
        loadComponent: () =>
          import(
            '@features/admin/components/student-evaluation-list/student-evaluation-list-component'
          ).then((m) => m.StudentEvaluationListComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@features/admin/components/settings/settings-component').then(
            (m) => m.SettingsComponent,
          ),
      },
    ],
  },
  {
    path: 'print/faculty-evaluation',
    loadComponent: () =>
      import('@shared/components/faculty-evaluation-print-component/faculty-evaluation-print-component').then(
        (m) => m.FacultyEvaluationPrintComponent,
      ),
  },
  {
    path: 'print/student-evaluation',

    loadComponent: () =>
      import(
        '@shared/components/student-evaluation-list-print-component/student-evaluation-list-print-component'
      ).then((m) => m.StudentEvaluationListPrintComponent),
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
