import {
  HttpBackend,
  HttpClient,
  HttpEvent,
  HttpInterceptorFn,
  HttpParams,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import { environment } from '@environments/environment';
import { SessionActivityService } from '../../core/services/auth/session-activity-service';
import * as AuthActions from './../../core/store/auth/auth.action';
import { normalizeUnicode, repairSpecialCharacters } from '../normalize-text';

let isHandlingAuthError = false;
let csrfToken: string | null = null;
const SESSION_ACTIVITY_SYNCED_HEADER = 'X-FES-Session-Activity-Synced';
const CSRF_HEADER = 'X-XSRF-TOKEN';
let csrfHeaderName = CSRF_HEADER;

export const authInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {
  const store = inject(Store);
  const sessionActivity = inject(SessionActivityService);
  const httpBackend = inject(HttpBackend);

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

  const normalizeResponse = (event: HttpEvent<unknown>): HttpEvent<unknown> => {
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
  };

  return prepareCsrfRequest(cloned, httpBackend).pipe(
    switchMap((securedRequest) => next(securedRequest)),
    map(normalizeResponse),

    catchError((error) => {

      if (error?.status === 403 && requiresCsrf(cloned)) {
        csrfToken = null;

        return refreshCsrfToken(httpBackend).pipe(
          switchMap((token) =>
            token
              ? next(addCsrfHeader(cloned, token))
              : throwError(() => error),
          ),
          map(normalizeResponse),
          catchError((retryError) => {
            if (retryError?.status === 403) {
              csrfToken = null;
            }

            return throwError(() => retryError);
          }),
        );
      }

      // Allow login page to handle its own non-CSRF errors.
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

      if (error?.status === 403) {
        csrfToken = null;
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

function prepareCsrfRequest<T>(
  req: HttpRequest<T>,
  httpBackend: HttpBackend,
): Observable<HttpRequest<T>> {
  if (!requiresCsrf(req) || hasCsrfHeader(req)) {
    return of(addCsrfHeader(req));
  }

  const existingToken = csrfToken || readCookie('XSRF-TOKEN');
  if (existingToken) {
    csrfToken = existingToken;
    return of(addCsrfHeader(req, existingToken));
  }

  return refreshCsrfToken(httpBackend)
    .pipe(
      map((token) => token ? addCsrfHeader(req, token) : req),
      catchError(() => of(req)),
    );
}

function refreshCsrfToken(httpBackend: HttpBackend): Observable<string | null> {
  const http = new HttpClient(httpBackend);

  return http
    .get<{ token: string; headerName?: string }>(`${environment.API_URL}/auth/csrf`, {
      withCredentials: true,
    })
    .pipe(
      map((response) => {
        csrfToken = response.token;
        csrfHeaderName = response.headerName || CSRF_HEADER;
        return response.token;
      }),
      catchError(() => of(null)),
    );
}

function requiresCsrf<T>(req: HttpRequest<T>): boolean {
  const unsafeMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    req.method.toUpperCase(),
  );

  return unsafeMethod && !req.url.includes('/auth/csrf');
}

function addCsrfHeader<T>(
  req: HttpRequest<T>,
  token: string | null = csrfToken,
): HttpRequest<T> {
  if (!token || hasCsrfHeader(req)) {
    return req;
  }

  return req.clone({
    setHeaders: {
      [csrfHeaderName]: token,
    },
  });
}

function hasCsrfHeader<T>(req: HttpRequest<T>): boolean {
  return req.headers.has(CSRF_HEADER) || req.headers.has(csrfHeaderName);
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

  return value ? decodeURIComponent(value) : null;
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
