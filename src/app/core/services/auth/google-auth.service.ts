import { HttpClient } from '@angular/common/http';
import { inject, Injectable, NgZone } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
  clientId?: string;
}

export interface AuthConfigResponse {
  googleClientId?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: {
            isDismissedMoment: () => boolean;
            getDismissedReason: () => string;
          }) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private scriptLoaded = false;
  private scriptLoadingPromise: Promise<void> | null = null;
  private cachedClientId: string | null = null;
  private isGsiInitialized = false;

  private readonly credentialSubject = new Subject<string>();
  readonly credential$ = this.credentialSubject.asObservable();

  /**
   * Resolves the Google Client ID dynamically from the backend GET /auth/config endpoint,
   * keeping the backend (.env) as the authoritative single source of truth.
   */
  getClientId(): Observable<string> {
    if (this.cachedClientId) {
      return of(this.cachedClientId);
    }

    return this.http.get<AuthConfigResponse>(`${environment.API_URL}/auth/config`, { withCredentials: true }).pipe(
      map((res) => {
        const id = res?.googleClientId?.trim();
        if (!id) {
          throw new Error(
            'Google OAuth client ID is not configured on the backend server. Please set GOOGLE_CLIENT_ID in the backend .env file.'
          );
        }
        this.cachedClientId = id;
        return id;
      }),
      catchError((err) => {
        if (err.message && err.message.includes('GOOGLE_CLIENT_ID')) {
          throw err;
        }
        throw new Error('Unable to retrieve Google OAuth configuration from the backend server.');
      })
    );
  }

  /**
   * Dynamically loads the official Google Identity Services script.
   */
  loadGoogleSdk(): Promise<void> {
    if (this.scriptLoaded && window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        this.scriptLoaded = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.scriptLoaded = true;
        resolve();
      };
      script.onerror = (err) => {
        this.scriptLoadingPromise = null;
        reject(new Error('Failed to load Google Identity Services SDK: ' + String(err)));
      };

      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Initializes the Google Identity Services SDK once with FedCM enabled.
   */
  async initializeGsi(): Promise<string> {
    const clientId = await firstValueFrom(this.getClientId());
    await this.loadGoogleSdk();

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services SDK is not available.');
    }

    if (!this.isGsiInitialized) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: GoogleCredentialResponse) => {
          this.ngZone.run(() => {
            if (response?.credential) {
              this.credentialSubject.next(response.credential);
            }
          });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
      });
      this.isGsiInitialized = true;
    }

    return clientId;
  }

  /**
   * Renders the official Google Sign-In button into an HTML element.
   */
  async renderSignInButton(
    container: HTMLElement,
    options: Record<string, unknown> = {}
  ): Promise<void> {
    await this.initializeGsi();

    if (window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: 320,
        ...options
      });
    }
  }

  /**
   * Requests a Google ID Token via Google Identity Services prompt.
   */
  promptForIdToken(): Observable<string> {
    return new Observable<string>((observer) => {
      this.initializeGsi()
        .then(() => {
          const sub = this.credential$.subscribe({
            next: (token) => {
              observer.next(token);
              observer.complete();
              sub.unsubscribe();
            },
            error: (err) => observer.error(err)
          });

          window.google?.accounts?.id?.prompt((notification) => {
            if (notification?.isDismissedMoment?.()) {
              this.ngZone.run(() => {
                observer.error(new Error('Google Sign-In prompt was dismissed.'));
                sub.unsubscribe();
              });
            }
          });
        })
        .catch((err) => {
          this.ngZone.run(() => observer.error(err));
        });
    });
  }
}
