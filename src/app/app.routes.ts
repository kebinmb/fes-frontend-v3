import { Routes } from '@angular/router';
import { authGuard } from '@utilities/guards/auth/auth-guard';
import { guestGuard } from '@utilities/guards/guest/guest-guard';
import { roleGuard } from '@utilities/guards/role/role-guard';

export const routes: Routes = [
  {
    path: 'oauth-success',
    title: 'Authentication Success - CHMSU FES',
    loadComponent: () =>
      import('@shared/components/oauth-success-component/oauth-success-component').then(
        (m) => m.OauthSuccessComponent,
      ),
  },
  {
    path: 'oauth-failure',
    redirectTo: 'login',
  },
  {
    path: 'verify-report/:reportId',
    title: 'Report Verification - CHMSU FES',
    loadComponent: () =>
      import('@shared/components/report-verification-component/report-verification-component').then(
        (m) => m.ReportVerificationComponent,
      ),
  },
  {
    path: 'login',
    title: 'Login - CHMSU FES',
    loadComponent: () =>
      import('@features/auth/login/login-component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'admin',
    title: 'Administrator Login - CHMSU FES',
    loadComponent: () =>
      import('@features/auth/login-admin/login-admin-component').then(
        (m) => m.LoginAdminComponent,
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'student-dashboard',
    title: 'Student Dashboard - CHMSU FES',
    loadComponent: () =>
      import('@features/student/pages/student-dashboard/student-dashboard-component').then(
        (m) => m.StudentDashboardComponent,
      ),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_STUDENT' },
  },
  {
    path: 'supervisor-dashboard',
    title: 'Supervisor Dashboard - CHMSU FES',
    loadComponent: () =>
      import(
        '@features/supervisor/pages/supervisor-dashboard/supervisor-dashboard-component'
      ).then((m) => m.SupervisorDashboardComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: ['ROLE_DEAN', 'ROLE_PROGRAM_CHAIR'] },
  },
  {
    path: 'evaluation-form',
    title: 'Faculty Evaluation - CHMSU FES',
    loadComponent: () =>
      import('@features/evaluation/pages/evaluation-form/evaluation-form-component').then(
        (m) => m.EvaluationFormComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin-dashboard',
    title: 'Admin Dashboard - CHMSU FES',
    loadComponent: () =>
      import('@features/admin/pages/admin-dashboard/admin-dashboard-component').then(
        (m) => m.AdminDashboardComponent,
    ),
    canActivate: [authGuard, roleGuard],
    data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
    children: [
      {
        path: '',
        title: 'Admin Dashboard - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/admin-dashboard-overview/admin-dashboard-overview-component'
          ).then((m) => m.AdminDashboardOverviewComponent),
      },
      {
        path: 'dashboard',
        title: 'Dashboard Overview - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/admin-dashboard-overview/admin-dashboard-overview-component'
          ).then((m) => m.AdminDashboardOverviewComponent),
      },
      {
        path: 'faculty-list',
        title: 'Faculty List - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-data-table/faculty-data-table-component'
          ).then((m) => m.FacultyDataTableComponent),
      },
      {
        path: 'supervisor-evaluations',
        title: 'Supervisor Evaluations - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
        loadComponent: () =>
          import(
            '@features/admin/components/supervisor-evaluation-dashboard-component'
          ).then((m) => m.SupervisorEvaluationDashboardComponent),
      },
      {
        path: 'faculty-workloads',
        title: 'Faculty Workloads - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-workload/faculty-workload-component'
          ).then((m) => m.FacultyWorkloadComponent),
      },
      {
        path: 'faculty-workload-coverage',
        title: 'Workload Coverage - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-workload-coverage/faculty-workload-coverage-component'
          ).then((m) => m.FacultyWorkloadCoverageComponent),
      },
      {
        path: 'class-assignments',
        title: 'Class Assignments - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/class-assignments/class-assignments-component'
          ).then((m) => m.ClassAssignmentsComponent),
      },
      {
        path: 'evaluation-score-list',
        title: 'Evaluation Scores - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-evaluation-scores-data-table/faculty-evaluation-scores-data-table-component'
          ).then((m) => m.FacultyEvaluationScoresDataTableComponent),
      },
      {
        path: 'report-print-tracking',
        title: 'Report Print Tracking - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
        loadComponent: () =>
          import(
            '@features/admin/components/faculty-report-print-tracking/faculty-report-print-tracking-component'
          ).then((m) => m.FacultyReportPrintTrackingComponent),
      },
      {
        path: 'user-accounts',
        title: 'User Accounts - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/user-accounts-data-table/user-accounts-data-table-component'
          ).then((m) => m.UserAccountsDataTableComponent),
      },
      {
        path: 'student-evaluations',
        title: 'Student Evaluations - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/student-evaluations-data-table/student-evaluations-data-table-component'
          ).then((m) => m.StudentEvaluationsDataTableComponent),
      },
      {
        path: 'student-evaluation-list',
        title: 'Student Evaluation List - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import(
            '@features/admin/components/student-evaluation-list/student-evaluation-list-component'
          ).then((m) => m.StudentEvaluationListComponent),
      },
      {
        path: 'settings',
        title: 'Settings - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import('@features/admin/components/settings/settings-component').then(
            (m) => m.SettingsComponent,
          ),
      },
      {
        path: 'audit-logs',
        title: 'Audit Logs - CHMSU FES',
        canActivate: [roleGuard],
        data: { role: 'ROLE_ADMIN' },
        loadComponent: () =>
          import('@features/admin/components/audit-logs/audit-logs-component').then(
            (m) => m.AuditLogsComponent,
          ),
      },
    ],
  },
  {
    path: 'print/faculty-evaluation',
    title: 'Print Faculty Evaluation - CHMSU FES',
    loadComponent: () =>
      import('@shared/components/faculty-evaluation-print-component/faculty-evaluation-print-component').then(
        (m) => m.FacultyEvaluationPrintComponent,
    ),
    canActivate: [authGuard, roleGuard],
    data: { role: ['ROLE_ADMIN', 'ROLE_HR'] },
  },
  {
    path: 'print/student-evaluation',
    title: 'Print Student Evaluation - CHMSU FES',
    loadComponent: () =>
      import(
        '@shared/components/student-evaluation-list-print-component/student-evaluation-list-print-component'
      ).then((m) => m.StudentEvaluationListPrintComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'ROLE_ADMIN' },
  },
  {
    path: '401',
    redirectTo: 'unauthorized',
    pathMatch: 'full',
  },
  {
    path: 'unauthorized',
    title: '401 Unauthorized - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
    data: { code: 401 },
  },
  {
    path: '403',
    redirectTo: 'forbidden',
    pathMatch: 'full',
  },
  {
    path: 'forbidden',
    title: '403 Access Forbidden - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
    data: { code: 403 },
  },
  {
    path: '404',
    redirectTo: 'not-found',
    pathMatch: 'full',
  },
  {
    path: 'not-found',
    title: '404 Page Not Found - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
    data: { code: 404 },
  },
  {
    path: '500',
    redirectTo: 'server-error',
    pathMatch: 'full',
  },
  {
    path: 'server-error',
    title: '500 Server Error - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
    data: { code: 500 },
  },
  {
    path: 'error',
    title: 'System Error - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    title: '404 Page Not Found - CHMSU FES',
    loadComponent: () =>
      import('@features/error/error-component').then((m) => m.ErrorComponent),
    data: { code: 404 },
  },
];
