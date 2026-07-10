import { Injectable, NgZone, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import * as AuthActions from '../../store/auth/auth.action';
import { selectAuthenticationState } from '../../store/auth/auth.selector';

const IDLE_TIMEOUT_MS = 10 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 1000;
const SERVER_ACTIVITY_SIGNAL_WINDOW_MS = 30 * 1000;
const LAST_ACTIVITY_KEY = 'fes:last-session-activity-at';

@Injectable({ providedIn: 'root' })
export class SessionActivityService {
  private readonly store = inject(Store);
  private readonly zone = inject(NgZone);

  private authenticated = false;
  private expired = false;
  private started = false;
  private lastRecordedAt = 0;
  private idleTimer?: ReturnType<typeof setTimeout>;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    this.store.select(selectAuthenticationState).subscribe((state) => {
      const becameAuthenticated = state.isAuthenticated && !this.authenticated;
      this.authenticated = state.isAuthenticated;

      if (!this.authenticated) {
        this.expired = false;
        this.clearIdleTimer();
        return;
      }

      if (becameAuthenticated) {
        this.resumeAuthenticatedSession();
      }
    });

    this.zone.runOutsideAngular(() => {
      const activityEvents: (keyof WindowEventMap)[] = [
        'click',
        'keydown',
        'mousedown',
        'mousemove',
        'scroll',
        'touchstart',
        'wheel',
      ];

      for (const eventName of activityEvents) {
        window.addEventListener(eventName, this.handleUserActivity, { passive: true });
      }

      window.addEventListener('focus', this.handleReturnToApp);
      window.addEventListener('storage', this.handleStorageChange);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    });
  }

  recordApiActivity(): void {
    this.checkIdleDeadline();
  }

  expireIfIdle(): boolean {
    if (!this.isIdleExpired()) {
      return false;
    }

    this.expireSession();

    return true;
  }

  hasRecentUserActivity(): boolean {
    if (!this.authenticated || this.expired) {
      return false;
    }

    const lastActivity = Math.max(this.lastRecordedAt, this.readLastActivity());

    return !!lastActivity && Date.now() - lastActivity <= SERVER_ACTIVITY_SIGNAL_WINDOW_MS;
  }

  private readonly handleUserActivity = (): void => {
    this.recordActivity();
  };

  private readonly handleReturnToApp = (): void => {
    this.checkIdleDeadline();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.checkIdleDeadline();
    }
  };

  private readonly handleStorageChange = (event: StorageEvent): void => {
    if (!this.authenticated) {
      return;
    }

    if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
      this.lastRecordedAt = Number(event.newValue) || 0;
      this.checkIdleDeadline();
      return;
    }

    // localStorage.clear() in another tab means that session was logged out there.
    if (event.key === null || (event.key === LAST_ACTIVITY_KEY && event.newValue === null)) {
      this.expireSession();
    }
  };

  private resumeAuthenticatedSession(): void {
    this.expired = false;
    const storedActivity = this.readLastActivity();

    if (!storedActivity) {
      this.recordActivity(true);
      return;
    }

    this.lastRecordedAt = storedActivity;
    this.checkIdleDeadline();
  }

  private recordActivity(force = false): void {
    if (!this.authenticated || this.expired) {
      return;
    }

    const now = Date.now();
    if (!force && now - this.lastRecordedAt < ACTIVITY_THROTTLE_MS) {
      return;
    }

    this.lastRecordedAt = now;
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    this.scheduleIdleCheck(now);
  }

  private checkIdleDeadline(): void {
    if (!this.authenticated || this.expired) {
      return;
    }

    const lastActivity = Math.max(this.lastRecordedAt, this.readLastActivity());
    if (!lastActivity || Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
      this.expireSession();
      return;
    }

    this.lastRecordedAt = lastActivity;
    this.scheduleIdleCheck(lastActivity);
  }

  private scheduleIdleCheck(lastActivity: number): void {
    this.clearIdleTimer();
    const remaining = Math.max(0, IDLE_TIMEOUT_MS - (Date.now() - lastActivity));
    this.idleTimer = setTimeout(() => this.checkIdleDeadline(), remaining);
  }

  private expireSession(): void {
    if (!this.authenticated || this.expired) {
      return;
    }

    this.expired = true;
    this.clearIdleTimer();
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    this.zone.run(() => this.store.dispatch(AuthActions.sessionExpired()));
  }

  private readLastActivity(): number {
    return Number(localStorage.getItem(LAST_ACTIVITY_KEY)) || 0;
  }

  private isIdleExpired(): boolean {
    if (!this.authenticated || this.expired) {
      return false;
    }

    const lastActivity = Math.max(this.lastRecordedAt, this.readLastActivity());

    return !lastActivity || Date.now() - lastActivity >= IDLE_TIMEOUT_MS;
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }
}
