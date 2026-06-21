import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { CommonModule } from '@angular/common';
import { environment } from '@environments/environment';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login-admin-component',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-admin-component.html',
  styleUrl: './login-admin-component.css',
})
export class LoginAdminComponent {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);

  isCapsLockOn = false;

  isLoading$ = this.authFacade.isLoading$;

  adminForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(40)]],
    password: ['', [Validators.required]],
  });

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
    window.location.href =
      environment.oauth;
  }

  detectCapsLock(event: KeyboardEvent): void {

    this.isCapsLockOn =
      event.getModifierState &&
      event.getModifierState('CapsLock');
  }
}
