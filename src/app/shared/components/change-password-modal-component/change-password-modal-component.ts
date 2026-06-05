import {
  CommonModule
} from '@angular/common';

import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject
} from '@angular/core';

import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-change-password-modal-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl:
    './change-password-modal-component.html',
  styleUrl:
    './change-password-modal-component.css'
})
export class ChangePasswordModalComponent {

  @Input()
  isLoading = false;

  @Output()
  closed = new EventEmitter<void>();

  @Output()
  submitted = new EventEmitter<{
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }>();

  showCurrent = false;

  showNew = false;

  showConfirm = false;

  private readonly fb =
    inject(FormBuilder);

  readonly form = this.fb.group({
    currentPassword: [
      '',
      [
        Validators.required
      ]
    ],

    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ],

    confirmNewPassword: [
      '',
      [
        Validators.required
      ]
    ]
  });

  constructor() {

    this.form.valueChanges.subscribe(() => {

      this.validatePasswords();

    });

  }

  get currentPassword() {

    return this.form.controls.currentPassword;

  }

  get newPassword() {

    return this.form.controls.newPassword;

  }

  get confirmNewPassword() {

    return this.form.controls.confirmNewPassword;

  }

  get passwordStrength(): number {

    const value =
      this.newPassword.value ?? '';

    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;

    return score;

  }

  get passwordsMatch(): boolean {

    return (
      !!this.confirmNewPassword.value &&
      this.newPassword.value ===
      this.confirmNewPassword.value
    );

  }

  close(): void {

    this.resetState();

    this.closed.emit();

  }

  save(): void {

    this.validatePasswords();

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;

    }

    const {
      currentPassword,
      newPassword,
      confirmNewPassword
    } = this.form.getRawValue();

    this.submitted.emit({
      currentPassword:
        currentPassword ?? '',

      newPassword:
        newPassword ?? '',

      confirmNewPassword:
        confirmNewPassword ?? ''
    });

  }

  toggleCurrentPassword(): void {

    this.showCurrent =
      !this.showCurrent;

  }

  toggleNewPassword(): void {

    this.showNew =
      !this.showNew;

  }

  toggleconfirmNewPassword(): void {

    this.showConfirm =
      !this.showConfirm;

  }

  private validatePasswords(): void {

    const newPassword =
      this.newPassword.value;

    const confirmNewPassword =
      this.confirmNewPassword.value;

    if (
      confirmNewPassword &&
      newPassword !== confirmNewPassword
    ) {

      this.confirmNewPassword.setErrors({
        ...this.confirmNewPassword.errors,
        mismatch: true
      });

      return;

    }

    if (
      this.confirmNewPassword.hasError(
        'mismatch'
      )
    ) {

      const errors = {
        ...this.confirmNewPassword.errors
      };

      delete errors['mismatch'];

      this.confirmNewPassword.setErrors(
        Object.keys(errors).length
          ? errors
          : null
      );

    }

  }

  private resetState(): void {

    this.form.reset();

    this.showCurrent = false;

    this.showNew = false;

    this.showConfirm = false;

  }

}