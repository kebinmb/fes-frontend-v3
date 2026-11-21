import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GoogleAuthService } from '@core/services/auth/google-auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-admin-component',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-admin-component.html',
  styleUrl: './login-admin-component.css',
})
export class LoginAdminComponent implements AfterViewInit {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);
  private googleAuthService = inject(GoogleAuthService);
  private destroyRef = inject(DestroyRef);

  isCapsLockOn = false;
  readonly googleButtonRendered = signal<boolean>(false);

  isLoading$ = this.authFacade.isLoading$;

  adminForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(40)]],
    password: ['', [Validators.required]],
  });

  @ViewChild('googleSignInTarget') set googleSignInTargetRef(element: ElementRef<HTMLElement> | undefined) {
    if (element?.nativeElement && !this.googleButtonRendered()) {
      this.googleAuthService
        .renderSignInButton(element.nativeElement, {
          width: 350,
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
        })
        .then(() => {
          this.googleButtonRendered.set(true);
        })
        .catch(() => {
          this.googleButtonRendered.set(false);
        });
    }
  }

  ngAfterViewInit(): void {
    this.googleAuthService.credential$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((idToken) => {
        if (idToken) {
          this.authFacade.loginWithGoogle(idToken);
        }
      });
  }

  onAdminSubmit() {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    const { username, password } = this.adminForm.getRawValue();
    this.authFacade.loginAdministrator(username.trim(), password);
  }

  get adminFormControl() {
    return this.adminForm.controls;
  }

  loginWithGoogle(): void {
    this.googleAuthService.promptForIdToken().subscribe({
      next: (idToken) => {
        if (idToken) {
          this.authFacade.loginWithGoogle(idToken);
        }
      },
      error: () => {
        // Fallback or dismissed
      },
    });
  }

  detectCapsLock(event: KeyboardEvent): void {
    this.isCapsLockOn =
      event.getModifierState &&
      event.getModifierState('CapsLock');
  }
}
