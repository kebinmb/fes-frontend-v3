import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-admin-component',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login-admin-component.html',
  styleUrl: './login-admin-component.css',
})
export class LoginAdminComponent {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);
  role: 'student' | 'supervisor' = 'student';
  step: number = 0;
  accessCode$ = this.authFacade.accessCode$;
  setRole(role: 'student' | 'supervisor') {
    this.role = role;

    this.adminForm.reset();
  }

  adminForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(12)]],
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
      'http://localhost:8090/api/oauth2/authorization/google';
  }
}
