import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ViewChild,
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
import { GoogleAuthService } from '@core/services/auth/google-auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private googleAuthService = inject(GoogleAuthService);

  private destroy$ = new Subject<void>();

  role: 'student' | 'supervisor' = 'student';

  step = 0;

  isCapsLockOn = false;

  readonly googleButtonRendered = signal<boolean>(false);

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

  @ViewChild('googleSignInTarget') set googleSignInTargetRef(element: ElementRef<HTMLElement> | undefined) {
    if (element?.nativeElement && !this.googleButtonRendered()) {
      this.googleAuthService
        .renderSignInButton(element.nativeElement, {
          width: 320,
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

    this.googleAuthService.credential$
      .pipe(takeUntil(this.destroy$))
      .subscribe((idToken) => {
        if (idToken) {
          this.authFacade.loginWithGoogle(idToken);
        }
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

    if (role === 'supervisor') {
      this.googleButtonRendered.set(false);
    }
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
    this.googleAuthService.promptForIdToken().subscribe({
      next: (idToken) => {
        if (idToken) {
          this.authFacade.loginWithGoogle(idToken);
        }
      },
      error: () => {},
    });
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
