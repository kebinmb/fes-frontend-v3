import { Component, computed, effect, inject } from '@angular/core';
import { StudentDataFacade } from '@core/store/student-data/student-data.facade';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { SupervisorDataFacade } from '@core/store/supervisor-data/supervisor-data.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluationDataFacade } from '@core/store/evaluation-data/evaluation.facade';
import {
  EvaluationCategory,
  EvaluationCriteria,
  SubjectEvaluationDTO,
} from '@core/services/evaluation/evaluation-service';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal-component/confirmation-modal-component';

export type UserRole = 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN' | 'ROLE_PROGRAM_CHAIR';

@Component({
  selector: 'app-evaluation-form-component',
  imports: [CommonModule, ReactiveFormsModule, ConfirmationModalComponent],
  templateUrl: './evaluation-form-component.html',
  styleUrl: './evaluation-form-component.css',
})
export class EvaluationFormComponent {
  private studentDataFacade = inject(StudentDataFacade);
  private supervisorDataFacade = inject(SupervisorDataFacade);
  private evaluationDataFacade = inject(EvaluationDataFacade);
  private authFacade = inject(AuthFacade);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  role$ = this.authFacade.role$;
  evaluatorId$ = this.authFacade.evaluatorId$;

  selectedClass$ = combineLatest([
    this.role$,
    this.studentDataFacade.selectedClass$,
    this.supervisorDataFacade.selectedClass$,
  ]).pipe(
    map(([role, studentClass, supervisorClass]) =>
      role === 'ROLE_DEAN' || role === 'ROLE_PROGRAM_CHAIR'
        ? supervisorClass
        : studentClass
    )
  );

  selectedClass = toSignal(this.selectedClass$, { initialValue: null });

  template = toSignal(this.evaluationDataFacade.template$, { initialValue: null });
  isLoading = toSignal(this.evaluationDataFacade.isLoading$);
  hasAlreadyEvaluated = toSignal(this.evaluationDataFacade.hasEvaluated$);
  isSubmitting = toSignal(this.evaluationDataFacade.submitting$);

  role = toSignal(this.role$);
  evaluatorId = toSignal(this.evaluatorId$);
  accessCode = toSignal(this.authFacade.accessCode$);

  facultyId = computed(() => this.selectedClass()?.facultyId || '');
  facultyName = computed(() => this.selectedClass()?.facultyName ?? '');
  classCode = computed(() => this.selectedClass()?.classCode ?? '');
  subjectCode = computed(() => this.selectedClass()?.subjectCode ?? '');
  yearLevel = computed(() => this.selectedClass()?.yearLevel ?? '');
  subjectTitle = computed(() => this.selectedClass()?.subjectDescription ?? '');
  semester = computed(() => this.selectedClass()?.semester ?? '');
  schoolYear = computed(() => this.selectedClass()?.schoolYear ?? 0);
  college = computed(() => this.selectedClass()?.college ?? '');

  ratingOptions = computed(() => this.template()?.ratingOptions ?? []);
  categories = computed(() => this.template()?.categories ?? []);

  evaluationForm: FormGroup = this.fb.group({});
  showSubmitConfirmation = false;
  showCancelConfirmation = false;

  constructor() {
    effect(() => {
      const categories = this.categories();
      if (!categories.length) return;
      this.buildForm(categories);
    });
  }

  private buildForm(categories: EvaluationCategory[]) {
    const dynamicControls = categories.flatMap((cat) =>
      cat.criteria.map((crit: EvaluationCriteria) => [
        crit.name,
        ['', Validators.required],
      ])
    );

    this.evaluationForm = this.fb.group({
      ...Object.fromEntries(dynamicControls),
      comments: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.evaluationDataFacade.initialize();

    combineLatest([
      this.role$,
      this.evaluatorId$,
      this.selectedClass$,
      this.studentDataFacade.studentLoads$,
    ])
      .pipe(
        filter(([role, evaluatorId]) => !!role && !!evaluatorId),
        take(1)
      )
      .subscribe(([role, evaluatorId, selectedClass, loads]) => {

        if (!selectedClass) {
          this.router.navigate(['/dashboard']);
          return;
        }

        if (role === 'ROLE_STUDENT') {
          if (!loads || loads.length === 0) {
            this.studentDataFacade.loadStudentLoads(
              evaluatorId!,
              0,
              10,
              'desc'
            );
          }
        }

      });
  }

  onSubmit() {

    if (
      this.evaluationForm.invalid ||
      this.hasAlreadyEvaluated()
    ) {

      this.markFormGroupTouched();
      return;

    }

    this.showSubmitConfirmation = true;

  }
  confirmSubmit(): void {

    this.showSubmitConfirmation = false;

    const dto =
      this.mapFormToDTO(
        this.evaluationForm.value
      );

    this.evaluationDataFacade.submit(dto);

  }

  closeSubmitConfirmation(): void {

    this.showSubmitConfirmation = false;

  }

  requestCancel(): void {

    if (this.evaluationForm.dirty) {

      this.showCancelConfirmation = true;
      return;

    }

    this.navigateBack();

  }

  confirmCancel(): void {

    this.showCancelConfirmation = false;
    this.navigateBack();

  }

  closeCancelConfirmation(): void {

    this.showCancelConfirmation = false;

  }

  private mapFormToDTO(formValue: any): SubjectEvaluationDTO {
    const ratings: Record<string, string> = {};

    this.categories()?.forEach((category) => {
      category.criteria.forEach((crit) => {
        ratings[crit.name] = formValue[crit.name];
      });
    });

    return {
      facultyId: this.facultyId(),
      evaluatorId: this.evaluatorId() || '',
      subjectCode: this.subjectCode(),
      classCode: this.classCode(),
      semester: this.semester(),
      yearLevel: this.yearLevel(),
      schoolYear: this.schoolYear(),
      accessCode: this.accessCode() || '',
      ratings,
      commentsOrFeedbacks: formValue.comments || undefined,
    };
  }

  totalRequiredCount(): number {

    return this.categories().reduce(
      (total, category) => total + category.criteria.length,
      1,
    );

  }

  completedRequiredCount(): number {

    const ratedCriteria = this.categories().reduce((total, category) => {
      const completedInCategory = category.criteria.filter((criteria) =>
        !!this.evaluationForm.get(criteria.name)?.value,
      ).length;

      return total + completedInCategory;
    }, 0);

    const hasComments =
      !!this.evaluationForm.get('comments')?.value?.trim();

    return ratedCriteria + (hasComments ? 1 : 0);

  }

  remainingRequiredCount(): number {

    return Math.max(
      this.totalRequiredCount() - this.completedRequiredCount(),
      0,
    );

  }

  completionPercent(): number {

    const total = this.totalRequiredCount();

    if (!total) {

      return 0;

    }

    return Math.round(
      (this.completedRequiredCount() / total) * 100,
    );

  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.evaluationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched() {
    Object.values(this.evaluationForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }

  private navigateBack(): void {

    const role = this.role();

    if (
      role === 'ROLE_DEAN' ||
      role === 'ROLE_PROGRAM_CHAIR'
    ) {
      this.router.navigate(['/supervisor-dashboard']);
    } else if (role === 'ROLE_STUDENT') {
      this.router.navigate(['/student-dashboard']);
    } else {
      this.router.navigate(['/login']);
    }

  }
}
