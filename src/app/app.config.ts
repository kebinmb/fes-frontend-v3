import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { AuthEffects } from './core/store/auth/auth.effects';
import { ToastEffect } from './core/store/toast/toast.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { StudentDataEffects } from './core/store/student-data/student-data.effects';
import { SupervisorDataEffects } from './core/store/supervisor-data/supervisor-data.effects';
import { metaReducers } from './core/store/meta-reducers/meta-reducers';
import { reducers } from './core/store';
import { EvaluationEffects } from './core/store/evaluation-data/evaluation.effects';
import { AdminEffects } from './core/store/admin-data/admin-data.effects';
import { authInterceptor } from './utilities/interceptor/auth-interceptor';
import { MigrationEffects } from './core/store/migration/migration.effects';
import { SchoolYearAndSemesterEffects } from './core/store/school-year-and-semester/school-year-and-semester.effects';
import { StudentEvaluationEffects } from './core/store/student-evaluation-data/student-evaluation-data.effects';
import { SessionActivityService } from './core/services/auth/session-activity-service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(SessionActivityService).start()),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideStore(reducers, {
      metaReducers,
    }),
    provideEffects([
      AuthEffects,
      ToastEffect,
      StudentDataEffects,
      SupervisorDataEffects,
      EvaluationEffects,
      AdminEffects,
      MigrationEffects,
      SchoolYearAndSemesterEffects,
      StudentEvaluationEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
