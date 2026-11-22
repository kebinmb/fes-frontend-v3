import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectAuthenticationState, selectRole } from '../../core/store/auth/auth.selector';

export interface ErrorPreset {
  code: number;
  badge: string;
  badgeClass: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconBgClass: string;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  suggestion?: string;
}

const ERROR_PRESETS: Record<number, ErrorPreset> = {
  401: {
    code: 401,
    badge: '401 Unauthorized',
    badgeClass: 'badge-warning',
    title: 'Authentication Required',
    subtitle: 'Your session has expired or sign-in is required',
    description:
      'We were unable to verify an active session for this request. Please sign in with your university credentials to continue.',
    icon: 'bi-shield-lock-fill',
    iconBgClass: 'icon-warning',
    primaryActionLabel: 'Sign In to Continue',
    secondaryActionLabel: 'Return to Login',
    suggestion: 'If your session timed out after a period of inactivity, logging in again will restore your work.',
  },
  403: {
    code: 403,
    badge: '403 Forbidden',
    badgeClass: 'badge-danger',
    title: 'Access Restricted',
    subtitle: 'You do not have permission to view this resource',
    description:
      'This area of the Faculty Evaluation System is restricted. Your current user role does not have authorization to access this page or perform this action.',
    icon: 'bi-shield-slash-fill',
    iconBgClass: 'icon-danger',
    primaryActionLabel: 'Go to Your Dashboard',
    secondaryActionLabel: 'Switch Account',
    suggestion:
      'If you believe this is an error or require elevated privileges, please contact your department chair, college dean, or the MIS/ICT unit.',
  },
  404: {
    code: 404,
    badge: '404 Not Found',
    badgeClass: 'badge-info',
    title: 'Page Not Found',
    subtitle: 'The requested address could not be located',
    description:
      'The page or resource you are looking for does not exist, has been relocated, or is temporarily unavailable.',
    icon: 'bi-compass-fill',
    iconBgClass: 'icon-info',
    primaryActionLabel: 'Back to Dashboard',
    secondaryActionLabel: 'Go Back',
    suggestion: 'Please verify the URL in your address bar, or use the navigation button below to return to safety.',
  },
  500: {
    code: 500,
    badge: '500 Server Error',
    badgeClass: 'badge-danger',
    title: 'System Unavailable',
    subtitle: 'The evaluation server encountered an unexpected error',
    description:
      'An unexpected error occurred while communicating with the university servers. Our technical team has been notified.',
    icon: 'bi-hdd-network-fill',
    iconBgClass: 'icon-danger',
    primaryActionLabel: 'Try Again',
    secondaryActionLabel: 'Return Home',
    suggestion: 'Please wait a moment and refresh the page. If the problem persists, please report it to ICT Support.',
  },
  503: {
    code: 503,
    badge: '503 Maintenance',
    badgeClass: 'badge-warning',
    title: 'Service Maintenance',
    subtitle: 'System is temporarily offline for routine updates',
    description:
      'The Faculty Evaluation System is undergoing scheduled maintenance, database synchronization, or performance optimization.',
    icon: 'bi-tools',
    iconBgClass: 'icon-warning',
    primaryActionLabel: 'Check Again',
    secondaryActionLabel: 'Return to Login',
    suggestion: 'Service will be restored as soon as updates conclude. Thank you for your patience.',
  },
};

@Component({
  selector: 'app-error',
  imports: [CommonModule, RouterModule],
  templateUrl: './error-component.html',
  styleUrl: './error-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly store = inject(Store);

  readonly currentRole = toSignal(this.store.select(selectRole));
  readonly authState = toSignal(this.store.select(selectAuthenticationState));

  readonly errorCode = computed<number>(() => {
    // 1. Check route data
    const dataCode = this.route.snapshot.data['code'];
    if (dataCode && ERROR_PRESETS[Number(dataCode)]) {
      return Number(dataCode);
    }

    // 2. Check query params (?code=403)
    const paramCode = this.route.snapshot.queryParamMap.get('code');
    if (paramCode && ERROR_PRESETS[Number(paramCode)]) {
      return Number(paramCode);
    }

    // 3. Check history navigation state
    const stateCode = (this.location.getState() as Record<string, unknown>)?.['code'];
    if (stateCode && ERROR_PRESETS[Number(stateCode)]) {
      return Number(stateCode);
    }

    // 4. Default to 404
    return 404;
  });

  readonly customMessage = computed<string | null>(() => {
    return (
      this.route.snapshot.queryParamMap.get('message') ||
      ((this.location.getState() as Record<string, unknown>)?.['message'] as string) ||
      null
    );
  });

  readonly errorPreset = computed<ErrorPreset>(() => {
    const code = this.errorCode();
    return ERROR_PRESETS[code] ?? ERROR_PRESETS[404];
  });

  readonly dashboardPath = computed<string>(() => {
    const role = this.currentRole();
    switch (role) {
      case 'ROLE_STUDENT':
        return '/student-dashboard';
      case 'ROLE_DEAN':
      case 'ROLE_PROGRAM_CHAIR':
        return '/supervisor-dashboard';
      case 'ROLE_ADMIN':
        return '/admin-dashboard';
      case 'ROLE_HR':
        return '/admin-dashboard/faculty-list';
      default:
        return '/login';
    }
  });

  readonly isAuthenticated = computed<boolean>(() => {
    return !!this.authState()?.isAuthenticated;
  });

  readonly primaryButtonLabel = computed<string>(() => {
    const code = this.errorCode();
    if (code === 401) {
      return 'Sign In to Continue';
    }
    if (code === 500 || code === 503) {
      return 'Refresh Page';
    }
    if (this.isAuthenticated()) {
      return 'Go to Your Dashboard';
    }
    return 'Return to Sign In';
  });

  readonly currentUrl = signal<string>(window.location.pathname);

  onPrimaryAction(): void {
    const code = this.errorCode();
    if (code === 401) {
      this.router.navigate(['/login']);
      return;
    }
    if (code === 500 || code === 503) {
      window.location.reload();
      return;
    }
    this.router.navigate([this.dashboardPath()]);
  }

  onSecondaryAction(): void {
    const code = this.errorCode();
    if (code === 403) {
      // Allow switching account on 403
      this.router.navigate(['/login']);
      return;
    }
    if (code === 404) {
      this.location.back();
      return;
    }
    this.router.navigate([this.dashboardPath()]);
  }

  goBack(): void {
    this.location.back();
  }
}
