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
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([])),
    provideStore({
      auth: authReducer,
      toast: toastReducer,
      spinner: spinnerReducer,
    }),
    provideEffects([AuthEffects, ToastEffect]),
    // provideAppInitializer(() => {
    //   const authFacade = inject(AuthFacade);
    //   authFacade.checkLoggedInUserAuthentication();
    // }),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
  ],
};
