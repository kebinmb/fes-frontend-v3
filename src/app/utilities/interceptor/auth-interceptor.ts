import { HttpInterceptorFn, HttpParams, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import { SessionActivityService } from '../../core/services/auth/session-activity-service';
import * as AuthActions from './../../core/store/auth/auth.action';
import { normalizeUnicode, repairSpecialCharacters } from '../normalize-text';

let isHandlingAuthError = false;
const SESSION_ACTIVITY_SYNCED_HEADER = 'X-FES-Session-Activity-Synced';

export const authInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {
  const store = inject(Store);
  const sessionActivity = inject(SessionActivityService);

  let cloned = req.clone({
    body: normalizeRequestBody(req.body),
    params: normalizeRequestParams(req.params),
    withCredentials: true,
  });

  const isAuthRequest =
    req.url.includes('/auth/student/login') ||
    req.url.includes('/auth/supervisor/login') ||
    req.url.includes('/auth/administrator/login') ||
    req.url.includes('/auth/access-code/generate') ||
    req.url.includes('/auth/logout');

  if (!isAuthRequest && sessionActivity.expireIfIdle()) {
    return throwError(() => new Error('Session expired'));
  }

  const shouldSendUserActivitySignal =
    !isAuthRequest && sessionActivity.shouldSendUserActivitySignal();

  if (shouldSendUserActivitySignal) {
    cloned = cloned.clone({
      setHeaders: {
        'X-FES-User-Activity': 'true',
      },
    });
  }

  if (!isAuthRequest) {
    sessionActivity.recordApiActivity();
  }

  return next(cloned).pipe(
    map((event) => {
      if (event instanceof HttpResponse) {
        isHandlingAuthError = false;

        if (!isAuthRequest) {
          sessionActivity.recordApiActivity();
        }

        if (
          shouldSendUserActivitySignal &&
          event.headers.get(SESSION_ACTIVITY_SYNCED_HEADER) === 'true'
        ) {
          sessionActivity.markServerActivitySynced();
        }

        return event.clone({
          body: repairSpecialCharacters(event.body),
        });
      }

      return event;
    }),

    catchError((error) => {

      // Allow login page to handle its own errors
      if (isAuthRequest) {

        return throwError(() => error);
      }

      // Session expired
      if (error?.status === 401) {
        if (isHandlingAuthError) {
          return throwError(() => error);
        }

        isHandlingAuthError = true;

        store.dispatch(
          AuthActions.sessionExpired()
        );
      }

      return throwError(() => error);
    }),
  );
};

function normalizeRequestBody<T>(body: T): T {
  if (
    !body ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }

  return repairSpecialCharacters(body);
}

function normalizeRequestParams(params: HttpParams): HttpParams {
  let normalized = new HttpParams();

  for (const key of params.keys()) {
    const normalizedKey = normalizeUnicode(key);
    const values = params.getAll(key) ?? [];

    for (const value of values) {
      normalized = normalized.append(normalizedKey, normalizeUnicode(value));
    }
  }

  return normalized;
}
