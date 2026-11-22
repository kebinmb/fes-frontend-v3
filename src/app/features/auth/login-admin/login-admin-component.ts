import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GoogleAuthService } from '@core/services/auth/google-auth.service';
import { GoogleSignInButtonComponent } from '@shared/components/google-sign-in-button-component/google-sign-in-button-component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-login-admin-component',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, GoogleSignInButtonComponent],
  templateUrl: './login-admin-component.html',
  styleUrl: './login-admin-component.css',
})
export class LoginAdminComponent implements OnInit {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);
  private googleAuthService = inject(GoogleAuthService);
  private destroyRef = inject(DestroyRef);

  isCapsLockOn = false;
  isLoading$ = this.authFacade.isLoading$;

  adminForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(40)]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
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

  detectCapsLock(event: KeyboardEvent): void {
    this.isCapsLockOn =
      event.getModifierState &&
      event.getModifierState('CapsLock');
  }
}
