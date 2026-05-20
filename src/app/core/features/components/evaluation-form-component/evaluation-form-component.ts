import { Component, computed, effect, inject } from '@angular/core';
import { StudentDataFacade } from '../../../store/student-data/student-data.facade';
import { CommonModule } from '@angular/common';
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
  SubjectEvaluationDTO,
} from '../../../services/evaluation/evaluation-service';

export type UserRole = 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN';

@Component({
  selector: 'app-evaluation-form-component',
  imports: [CommonModule, ReactiveFormsModule],
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

  /* ================= STATE ================= */

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
  
  /* ================= COMPUTED ================= */

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

  /* ================= FORM ================= */

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

  /* ================= INIT ================= */

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

        // ✅ NO redundant supervisor select
      });
  }

  /* ================= SUBMIT ================= */

  onSubmit() {
    if (this.evaluationForm.invalid || this.hasAlreadyEvaluated()) {
      this.markFormGroupTouched();
      return;
    }
    console.log("Access Code", this.accessCode());
    const dto = this.mapFormToDTO(this.evaluationForm.value);
    this.evaluationDataFacade.submit(dto);
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
      yearLevel:this.yearLevel(),
      schoolYear: this.schoolYear(),
      accessCode: this.accessCode() || '',
      ratings,
      commentsOrFeedbacks: formValue.comments || undefined,
    };
  }

  /* ================= UI ================= */

  cancel() {
    if (confirm('Are you sure you want to cancel? Your progress will be lost.')) {
      const role = this.role();

      if (role === 'ROLE_DEAN') {
        this.router.navigate(['/supervisor-dashboard']);
      } else if (role === 'ROLE_STUDENT') {
        this.router.navigate(['/student-dashboard']);
      } else {
        this.router.navigate(['/login']);
      }
    }
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
}