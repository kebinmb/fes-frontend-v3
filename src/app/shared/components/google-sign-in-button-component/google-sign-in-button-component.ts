import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleAuthService } from '@core/services/auth/google-auth.service';
import { ToastFacade } from '@core/store/toast/toast.facade';

@Component({
  selector: 'app-google-sign-in-button',
  imports: [CommonModule],
  templateUrl: './google-sign-in-button-component.html',
  styleUrl: './google-sign-in-button-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleSignInButtonComponent {
  private readonly googleAuthService = inject(GoogleAuthService);
  private readonly toastFacade = inject(ToastFacade);

  readonly width = input<number>(320);
  readonly theme = input<'outline' | 'filled_blue' | 'filled_black'>('outline');
  readonly text = input<'signin_with' | 'signup_with' | 'continue_with' | 'signin'>('continue_with');
  readonly shape = input<'rectangular' | 'pill' | 'circle' | 'square'>('rectangular');

  readonly googleButtonRendered = signal<boolean>(false);

  @ViewChild('googleSignInTarget') set googleSignInTargetRef(element: ElementRef<HTMLElement> | undefined) {
    if (element?.nativeElement && !this.googleButtonRendered()) {
      this.googleAuthService
        .renderSignInButton(element.nativeElement, {
          width: this.width(),
          theme: this.theme(),
          text: this.text(),
          shape: this.shape(),
          size: 'large',
          logo_alignment: 'left',
        })
        .then(() => {
          this.googleButtonRendered.set(true);
        })
        .catch((err: unknown) => {
          console.error('[GoogleSignInButton] Failed to initialize Google Sign-In:', err);
          this.googleButtonRendered.set(false);
        });
    }
  }

  onButtonClick(): void {
    this.googleAuthService
      .prompt()
      .catch((err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes('Google OAuth') || errorMsg.includes('backend server')) {
          this.toastFacade.showToast(errorMsg, 'error');
        } else {
          this.toastFacade.showToast(
            'Unable to reach Google services. Please check your internet connection or disable ad-blockers for this site.',
            'error',
          );
        }
      });
  }
}
