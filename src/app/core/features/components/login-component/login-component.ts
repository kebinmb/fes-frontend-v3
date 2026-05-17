import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { AsyncPipe, CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-login-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent {
  private authFacade = inject(AuthFacade);
  private fb = inject(FormBuilder);
  role: 'student' | 'supervisor' = 'student';
  step: number = 0;
  accessCode$ = this.authFacade.accessCode$;

  constructor() {
    this.authFacade.error$.pipe(takeUntilDestroyed()).subscribe((error) => {
      if (error) {
        this.studentForm.reset();
      }
    });
    this.authFacade.error$.pipe(takeUntilDestroyed()).subscribe((error) => {
      if (error) {
        this.step = 0;
        this.studentForm.patchValue({ accessCode: '' });
      }
    });
  }

  setRole(role: 'student' | 'supervisor') {
    this.role = role;

    this.supervisorForm.reset();
    this.studentForm.reset();
  }

  studentForm = this.fb.nonNullable.group({
    studentId: ['', Validators.required],
    password: ['', Validators.required],
    accessCode: [''],
  });

  supervisorForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.maxLength(12)]],
    password: ['', [Validators.required]],
  });

  onSupervisorSubmit() {
    if (this.supervisorForm.invalid) {
      this.supervisorForm.markAllAsTouched();
      return;
    }
    const { username, password } = this.supervisorForm.getRawValue();
    this.authFacade.loginSupervisor(username.trim(), password);
  }

  get supervisorFormControl() {
    return this.supervisorForm.controls;
  }

  onStudentSubmit() {
    if (this.step === 0) {
      if (this.studentForm.get('studentId')?.invalid) {
        this.studentForm.get('studentId')?.markAsTouched();
        return;
      }
      const evaluatorId = this.studentForm.value.studentId!.trim();
      const password = this.studentForm.value.password!.trim();
      this.authFacade.generateStudentAccessCode(evaluatorId, password);
      this.step = 1;

      this.studentForm.get('accessCode')?.setValidators([Validators.required]);
      this.studentForm.get('accessCode')?.updateValueAndValidity();
    } else {
      if (this.studentForm.invalid) {
        this.studentForm.markAllAsTouched();
        return;
      }
      const payload: any = this.studentForm.value;
      this.authFacade.loginStudent(payload.studentId, payload.accessCode);
    }
  }
  loginWithGoogle(): void {
    window.location.href =
      'http://localhost:8090/api/oauth2/authorization/google';
  }
}
