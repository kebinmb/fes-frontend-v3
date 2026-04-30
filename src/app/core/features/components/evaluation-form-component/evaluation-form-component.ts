import { Component, computed, effect, inject } from '@angular/core';
import { StudentDataFacade } from '../../../store/student-data/student-data.facade';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, filter, map, take } from 'rxjs';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { SupervisorDataFacade } from '../../../store/supervisor-data/supervisor-data.facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EvaluationDataFacade } from '../../../store/evaluation-data/evaluation.facade';
import {
  EvaluationCategory,
  EvaluationCriteria,
} from '../../../services/evaluation/evaluation-service';
export type UserRole = 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN';
@Component({
  selector: 'app-evaluation-form-component',
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule],
  templateUrl: './evaluation-form-component.html',
  styleUrl: './evaluation-form-component.css',
})
export class EvaluationFormComponent {
  private studentDataFacade = inject(StudentDataFacade);
  private router = inject(Router);
  private authFacade = inject(AuthFacade);
  private supervisorDataFacade = inject(SupervisorDataFacade);
  private evaluationDataFacade = inject(EvaluationDataFacade);
  private fb = inject(FormBuilder);
  selectedStudentClass$ = this.studentDataFacade.selectedClass$;
  selectedFacultyClass$ = this.supervisorDataFacade.selectedClass$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  role$ = this.authFacade.role$;
  selectedClass$ = combineLatest([
    this.authFacade.role$,
    this.studentDataFacade.selectedClass$,
    this.supervisorDataFacade.selectedClassForEvaluation$,
  ]).pipe(
    map(([role, studentClass, supervisorClass]) => {
      if (role === 'ROLE_STUDENT') return studentClass;
      if (role === 'ROLE_DEAN') return supervisorClass;
      return null;
    }),
  );
  selectedClass = toSignal(this.selectedClass$, {
    initialValue: null,
  });
  template = toSignal(this.evaluationDataFacade.template$, {
    initialValue: null,
  });
  isLoading = toSignal(this.evaluationDataFacade.isLoading$);
  hasAlreadyEvaluated = toSignal(this.evaluationDataFacade.hasEvaluated$);
  isSubmitting = toSignal(this.evaluationDataFacade.submitting$);

  facultyName = computed(() => this.selectedClass()?.facultyName ?? '');
  semester = computed(() => this.selectedClass()?.semester ?? '');
  schoolYear = computed(() => this.selectedClass()?.schoolYear ?? '');
  subjectCode = computed(() => this.selectedClass()?.classCode ?? '');
  college = computed(() => this.selectedClass()?.college ?? '');
  yearLevel = computed(() => this.selectedClass()?.yearLevel ?? '');

  ratingOptions = computed(() => this.template()?.ratingOptions ?? []);
  categories = computed(() => this.template()?.categories ?? []);

  evaluationForm: FormGroup = this.fb.group({});

  constructor() {
    effect(() => {
      const categories = this.categories();
      if (!categories.length) return;
      this.buildForm(categories);
    });
  }

  private buildForm(categories: EvaluationCategory[]) {
    const dynamicControls = categories.flatMap((cat) =>
      cat.criteria.map((crit: EvaluationCriteria) => [crit.name, ['', Validators.required]]),
    );
    this.evaluationForm = this.fb.group({
      ...Object.fromEntries(dynamicControls),
      comments: ['', Validators.required],
    });
  }
  ngOnInit() {
    combineLatest([
      this.authFacade.role$,
      this.authFacade.evaluatorId$,
      this.studentDataFacade.selectedClass$,
      this.supervisorDataFacade.selectedClassForEvaluation$,
      this.studentDataFacade.studentLoads$,
    ])
      .pipe(
        filter(([role, evaluatorId]) => !!role && !!evaluatorId),
        take(1),
      )
      .subscribe(([role, evaluatorId, studentClass, supervisorClass, loads]) => {
        if (role === 'ROLE_STUDENT') {
          if (!studentClass) {
            this.router.navigate(['/dashboard']);
            return;
          }
          if (!loads || loads.length === 0) {
            this.studentDataFacade.loadStudentLoads(evaluatorId!, 0, 10, 'desc');
          }
        } else if (role === 'ROLE_DEAN') {
          if (!supervisorClass) {
            this.router.navigate(['/dashboard']);
            return;
          }
          this.supervisorDataFacade.selectClass(supervisorClass);
        }
      });
  }
  onSubmit() {}
  cancel() {}
  isFieldInvalid(fieldName: string): boolean {
    const field = this.evaluationForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
  private markFormGroupTouched() {
    Object.values(this.evaluationForm.controls).forEach((control) => {
      control.markAsTouched();
    });
  }
}
