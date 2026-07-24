import {
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import {
  AsyncPipe,
  NgClass,
} from '@angular/common';

import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AdminDataFacade } from '@core/store/admin-data/admin-data.facade';

import {
  CreateUserAccountRequest,
  FetchUserAccountsResponse,
  UpdateUserAccountRequest,
  UpdateUserPasswordRequest,
} from '@core/services/admin/admin-service';

@Component({
  selector: 'app-user-accounts-data-table-component',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './user-accounts-data-table-component.html',
  styleUrl: './user-accounts-data-table-component.css',
})

export class UserAccountsDataTableComponent implements OnInit {
  roles = [
    'FACULTY',
    'PROGRAM_CHAIR',
    'DEAN',
    'STUDENT',
    'ADMIN',
    'HR',
  ];

  statuses = [
    'ACTIVE',
    'INACTIVE',
  ];

  colleges = [
    'CIT',
    'CAS',
    'COENG',
    'COED',
    'CCS',
    'CCJ',
    'COF',
    'CBMA',
    'FOR_MIGRATION',
  ];

  programs = [
    'TCP',
    'SUMMER',
    'SPECIAL',
    'SP',
    'SHS',
    'ROTC',
    'REGISTRAR',
    'PRESCHOOL',
    'PHD',
    'OCTOBERIAN',
    'MTM',
    'MPA_DOT',
    'MPA',
    'MFT',
    'MBA',
    'MAT_TLE',
    'MAT_MATH',
    'MAT_GEN_SCI',
    'MAT_ENG',
    'MAT',
    'MAED_AT',
    'MAED',
    'HELE',
    'GRADUATE',
    'G11',
    'EDD',
    'ECP_BLG',
    'DPA',
    'DOED',
    'BTVTED',
    'BTTE',
    'BTLED',
    'BSOA',
    'BSNED',
    'BSMA',
    'BSIT',
    'BSIS',
    'BSIND',
    'BSHRM',
    'BSHM',
    'BSFI',
    'BSED',
    'BSE',
    'BSCRIM',
    'BSCE',
    'BSBCRIM',
    'BSBA_FM',
    'BSBA',
    'BSAM',
    'BSACT',
    'BSA',
    'BS_PSYCH',
    'BS_ECE',
    'BS_CPE',
    'BPED',
    'BPA',
    'BIT',
    'BEED',
    'BECED',
    'AIT',
    'ADVISING',
    'AB_SOCSCI',
    'AB_ENG_L',
    'AB_ENG',
  ];

  majors = [
    'BSED_ENG',
    'BSED_FIL',
    'BSED_FILIPINO',
    'BSED_MATH',
    'BSED_SCI',
    'BSED_SP_FIL_2',
    'BSED_TLE_SPC_SUMMER',
    'BSED4ASP',
    'NONE',
  ];

  dataSources = [
    { label: 'Unassigned', value: '' },
    { label: 'Talisay', value: 'LEGACY_TALISAY' },
    { label: 'Alijis', value: 'LEGACY_ALIJIS' },
    { label: 'Fortune-Towne', value: 'LEGACY_FT' },
    { label: 'Binalbagan', value: 'LEGACY_BINALBAGAN' },
  ];

  private adminDataFacade = inject(AdminDataFacade);

  private fb = inject(FormBuilder);

  userAccounts$ =
    this.adminDataFacade.userAccounts$;

  isModalOpen =
    signal(false);

  isEditMode =
    signal(false);

  selectedUser =
    signal<FetchUserAccountsResponse | null>(null);

  currentPage = 0;
  pageSize = 10;
  searchTerm = '';

  form = this.fb.group({

    userId: [0],

    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(
          '^[a-zA-Z0-9._-]+$'
        ),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    password: [
      '',
      [
        Validators.minLength(8),
        Validators.maxLength(50),
        Validators.pattern(
          '^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d).+$'
        ),
      ],
    ],

    role: [
      'ADMIN',
      Validators.required,
    ],

    status: [
      'ACTIVE',
      Validators.required,
    ],

    college: [
      'CAS',
      Validators.required,
    ],

    programs: [
      'BSIT',
      Validators.required,
    ],

    majors: [
      'NONE',
      Validators.required,
    ],

    dataSource: [
      '',
      Validators.maxLength(100),
    ],

    isEnabled: [true],

    isLocked: [false],
  });
  isInvalid(
    controlName: string
  ): boolean {

    const control =
      this.form.get(controlName);

    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  getErrorMessage(
    controlName: string
  ): string {

    const control =
      this.form.get(controlName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }

    if (control.errors['minlength']) {

      return `Minimum length is ${control.errors['minlength'].requiredLength} characters.`;
    }

    if (control.errors['maxlength']) {

      return `Maximum length exceeded.`;
    }

    if (control.errors['pattern']) {

      switch (controlName) {

        case 'username':

          return 'Only letters, numbers, dot, underscore and dash are allowed.';

        case 'password':

          return 'Password must contain uppercase, lowercase and number.';
      }
    }

    return 'Invalid field.';
  }
  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminDataFacade
      .loadUserAccounts(this.currentPage, this.pageSize, this.searchTerm);
  }

  onSearch(): void {
    this.searchTerm = this.searchTerm.replace(/\s+/g, ' ').trim();
    this.currentPage = 0;
    this.loadUsers();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadUsers();
  }

  onPageSizeChange(size: number | string): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 0;
    this.loadUsers();
  }

  onUserPageChange(
    page: number
  ): void {

    if (page < 0) {
      return;
    }

    this.currentPage = page;
    this.loadUsers();
  }

  openCreateModal(): void {

    this.isEditMode.set(false);

    this.selectedUser.set(null);

    this.form.reset({
      role: 'ADMIN',
      status: 'ACTIVE',
      college: 'CAS',
      programs: 'BSIT',
      majors: 'NONE',
      dataSource: '',
      isEnabled: true,
      isLocked: false,
    });

    this.isModalOpen.set(true);
  }

  openEditModal(
    user: FetchUserAccountsResponse
  ): void {

    this.isEditMode.set(true);

    this.selectedUser.set(user);

    this.form.patchValue({

      userId: Number(user.userId),

      username: user.username,

      email: user.email,

      role: user.role,

      status: user.status,
      college: user.college,

      programs: user.programs,

      majors: user.majors,
      dataSource: this.normalizedDataSource(user.dataSource ?? user.data_source),
      password: '',
    });

    this.isModalOpen.set(true);
  }

  closeModal(): void {

    this.isModalOpen.set(false);
  }

  submitForm(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    if (this.isEditMode()) {

      const payload:
        UpdateUserAccountRequest = {

        userId:
          this.form.value.userId!,

        username:
          this.form.value.username!,

        email:
          this.form.value.email!,

        role:
          this.form.value.role!,

        status:
          this.form.value.status!,

        college:
          this.form.value.college ?? '',

        programs:
          this.form.value.programs ?? '',

        majors:
          this.form.value.majors ?? '',

        dataSource:
          this.form.value.dataSource ?? '',

        isEnabled:
          this.form.value.isEnabled ?? true,

        isLocked:
          this.form.value.isLocked ?? false,
      };

      this.adminDataFacade
        .updateUserAccount(payload);

      if (
        this.form.value.password &&
        this.form.value.password.trim()
      ) {

        const passwordPayload:
          UpdateUserPasswordRequest = {

          userId:
            this.form.value.userId!,

          newPassword:
            this.form.value.password,
        };

        this.adminDataFacade
          .updateUserPassword(
            passwordPayload
          );
      }

    } else {

      const payload:
        CreateUserAccountRequest = {

        username:
          this.form.value.username!,

        email:
          this.form.value.email!,

        password:
          this.form.value.password!,

        role:
          this.form.value.role!,

        status:
          this.form.value.status!,

        college:
          this.form.value.college ?? '',

        programs:
          this.form.value.programs ?? '',

        majors:
          this.form.value.majors ?? '',

        dataSource:
          this.form.value.dataSource ?? '',
      };

      this.adminDataFacade
        .createUserAccount(payload);
    }

    this.closeModal();
  }

  dataSourceLabel(dataSource?: string | null): string {
    const normalized = this.normalizedDataSource(dataSource);

    return this.dataSources.find((option) => option.value === normalized)?.label
      ?? normalized
      ?? 'Unassigned';
  }

  private normalizedDataSource(dataSource?: string | null): string {
    return dataSource?.trim().toUpperCase() ?? '';
  }
}
