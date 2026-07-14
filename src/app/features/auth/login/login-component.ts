import {
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';

import {
  AsyncPipe,
  CommonModule,
} from '@angular/common';

import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  filter,
  Subject,
  takeUntil,
} from 'rxjs';

import { environment } from '@environments/environment';

import { AuthFacade } from '@core/store/auth/auth.facade';

@Component({
  selector: 'app-login-component',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent
  implements OnInit, OnDestroy {

  private authFacade = inject(AuthFacade);

  private fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  role: 'student' | 'supervisor' = 'student';

  step = 0;

  isCapsLockOn = false;

  accessCodeSent$ = this.authFacade.accessCodeSent$;

  isLoading$ = this.authFacade.isLoading$;

  studentForm = this.fb.nonNullable.group({
    studentId: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(12)
      ],
    ],

    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
      ],
    ],

    accessCode: [''],
  });

  supervisorForm = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.maxLength(40),
      ],
    ],

    password: [
      '',
      [
        Validators.required,
      ],
    ],
  });

  constructor() {

    this.authFacade.resetStudentLoginFlow();

    this.authFacade.error$
      .pipe(takeUntilDestroyed())
      .subscribe((error) => {

        if (!error) {
          return;
        }

        this.step = 0;

        this.studentForm.patchValue({
          accessCode: '',
        });

        this.studentForm
          .get('accessCode')
          ?.clearValidators();

        this.studentForm
          .get('accessCode')
          ?.updateValueAndValidity();
      });
  }

  ngOnInit(): void {

    this.authFacade.accessCodeSent$
      .pipe(
        filter((accessCodeSent) => accessCodeSent),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {

        this.step = 1;

        this.studentForm
          .get('accessCode')
          ?.setValidators([
            Validators.required,
            Validators.minLength(6),
          ]);

        this.studentForm
          .get('accessCode')
          ?.updateValueAndValidity();
      });
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  setRole(role: 'student' | 'supervisor'): void {

    this.role = role;

    this.step = 0;

    this.isCapsLockOn = false;

    this.supervisorForm.reset();

    this.studentForm.reset();

    this.authFacade.resetStudentLoginFlow();
  }

  get supervisorFormControl() {

    return this.supervisorForm.controls;
  }

  onSupervisorSubmit(): void {

    if (this.supervisorForm.invalid) {

      this.supervisorForm.markAllAsTouched();

      return;
    }

    const {
      username,
      password,
    } = this.supervisorForm.getRawValue();

    this.authFacade.loginSupervisor(
      username.trim(),
      password.trim(),
    );
  }

  onStudentSubmit(): void {

    if (this.step === 0) {

      if (
        this.studentForm.get('studentId')?.invalid ||
        this.studentForm.get('password')?.invalid
      ) {

        this.studentForm
          .get('studentId')
          ?.markAsTouched();

        this.studentForm
          .get('password')
          ?.markAsTouched();

        return;
      }

      const evaluatorId =
        this.studentForm.value.studentId!.trim();

      const password =
        this.studentForm.value.password!.trim();

      this.authFacade.generateStudentAccessCode(
        evaluatorId,
        password,
      );

      return;
    }

    if (this.studentForm.invalid) {

      this.studentForm.markAllAsTouched();

      return;
    }

    const payload = this.studentForm.getRawValue();

    this.authFacade.loginStudent(
      payload.studentId.trim(),
      payload.accessCode.trim().toUpperCase(),
    );
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

  forceUppercaseAccessCode(): void {

    const accessCode =
      this.studentForm.get('accessCode')?.value;

    if (!accessCode) {
      return;
    }

    this.studentForm.patchValue(
      {
        accessCode:
          accessCode.toUpperCase(),
      },
      {
        emitEvent: false,
      },
    );
  }

  allowOnlyNumbers(
    event: KeyboardEvent,
  ): void {

    const allowedKeys = [
      'Backspace',
      'Delete',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];

    if (
      allowedKeys.includes(event.key)
    ) {
      return;
    }

    if (!/^\d$/.test(event.key)) {

      event.preventDefault();
    }
  }
}
