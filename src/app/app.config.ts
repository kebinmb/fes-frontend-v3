import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
  APP_INITIALIZER,
  provideAppInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authReducer } from './core/store/auth/auth.reducer';
import { provideStore } from '@ngrx/store';
import { toastReducer } from './core/store/toast/toast.reducer';
import { spinnerReducer } from './core/store/spinner/spinner.reducer';
import { provideEffects } from '@ngrx/effects';
import { AuthEffects } from './core/store/auth/auth.effects';
import { ToastEffect } from './core/store/toast/toast.effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { studentLoadReducer } from './core/store/student-data/student-data.reducer';
import { StudentDataEffects } from './core/store/student-data/student-data.effects';
import { supervisorDataReducer } from './core/store/supervisor-data/supervisor-data.reducer';
import { SupervisorDataEffects } from './core/store/supervisor-data/supervisor-data.effects';
import { metaReducers } from './core/store/meta-reducers/meta-reducers';
import { reducers } from './core/store';
import { EvaluationEffects } from './core/store/evaluation-data/evaluation.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
    provideStore(reducers, {
      metaReducers,
    }),
    provideEffects([AuthEffects, ToastEffect, StudentDataEffects, SupervisorDataEffects, EvaluationEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
