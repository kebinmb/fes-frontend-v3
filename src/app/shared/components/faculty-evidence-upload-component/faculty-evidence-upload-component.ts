import { CommonModule } from '@angular/common';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FacultyClass, FacultyLoadDTO } from '@core/services/supervisor-data/supervisor-data-service';
import {
  EvidenceCriterion,
  FacultyEvidence,
  SliceResponse,
} from '@app/models/faculty-evidence.model';
import {
  EvidenceListFilters,
  FacultyEvidenceService,
  UploadEvidencePayload,
} from '@app/services/faculty-evidence.service';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal-component/confirmation-modal-component';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';

interface CriteriaGroup {
  category: string;
  items: EvidenceCriterion[];
}

@Component({
  selector: 'app-faculty-evidence-upload-component',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmationModalComponent,
  ],
  templateUrl: './faculty-evidence-upload-component.html',
  styleUrl: './faculty-evidence-upload-component.css',
})
export class FacultyEvidenceUploadComponent implements OnInit, OnChanges {
  @Input({ required: true })
  faculty!: FacultyLoadDTO;

  @Input()
  classes: FacultyClass[] = [];

  @Input()
  selectedClass: FacultyClass | null = null;

  @Input()
  allowClassSelection = true;

  @Input()
  scopeToSelectedClass = false;

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly evidenceService = inject(FacultyEvidenceService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private evidenceLoadRequestId = 0;
  private isDestroyed = false;

  readonly maxFileSizeMb = 15;
  readonly acceptedFileExtensions = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
  readonly acceptedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]);

  criteria: EvidenceCriterion[] = [];
  evidences: FacultyEvidence[] = [];
  selectedFile?: File;
  pendingDeleteEvidence?: FacultyEvidence;
  currentPage = 0;
  pageSize = 12;
  hasNextEvidencePage = false;
  isCriteriaLoading = false;
  isEvidenceLoading = false;
  isLoadingMore = false;
  isUploading = false;
  isDeleting = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';
  uploadStatusMessage = '';
  showDeleteConfirmation = false;

  readonly form = this.fb.group({
    criterion: ['', Validators.required],
    classIndex: [''],
    classCode: [''],
    subjectCode: [''],
    yearLevel: [''],
    semester: [''],
    schoolYear: [new Date().getFullYear()],
    description: [''],
  });

  readonly filterForm = this.fb.group({
    criterion: [''],
    classCode: [''],
    subjectCode: [''],
    semester: [''],
    schoolYear: [null as number | null],
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      this.isDestroyed = true;
    });
    this.loadCriteria();
    this.watchFilterChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['faculty'] || changes['selectedClass']) && this.faculty?.facultyId) {
      this.resetFormContext();
      this.loadEvidences();
    }
  }

  loadCriteria(): void {
    this.isCriteriaLoading = true;
    this.errorMessage = '';

    this.evidenceService
      .getCriteria()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (criteria) => {
          this.criteria = criteria;
          this.isCriteriaLoading = false;
          this.scheduleViewRefresh();
        },
        error: (error) => {
          this.errorMessage = this.extractApiMessage(error, 'Unable to load evidence criteria.');
          this.isCriteriaLoading = false;
          this.scheduleViewRefresh();
        },
      });
  }

  loadEvidences(append = false): void {
    if (!this.faculty?.facultyId) {
      return;
    }

    if (append && (!this.hasNextEvidencePage || this.isLoadingMore || this.isEvidenceLoading)) {
      return;
    }

    const requestId = ++this.evidenceLoadRequestId;

    if (append) {
      this.isLoadingMore = true;
    } else {
      this.currentPage = 0;
      this.evidences = [];
      this.hasNextEvidencePage = false;
      this.isEvidenceLoading = true;
      this.isLoadingMore = false;
    }

    this.errorMessage = '';
    this.scheduleViewRefresh();

    this.evidenceService
      .getEvidenceSlice(this.buildEvidenceFilters(append ? this.currentPage + 1 : 0))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (slice) => {
          if (requestId !== this.evidenceLoadRequestId) {
            return;
          }

          this.setSlice(slice, append);
          this.isEvidenceLoading = false;
          this.isLoadingMore = false;
          this.scheduleViewRefresh();
        },
        error: (error) => {
          if (requestId !== this.evidenceLoadRequestId) {
            return;
          }

          this.errorMessage = this.extractApiMessage(error, 'Unable to load evidence records.');
          this.isEvidenceLoading = false;
          this.isLoadingMore = false;
          this.scheduleViewRefresh();
        },
      });
  }

  loadMoreEvidences(): void {
    this.loadEvidences(true);
  }

  onClassContextChange(): void {
    this.successMessage = '';

    if (!this.allowClassSelection || this.selectedClass) {
      this.applySelectedClassContext();
      return;
    }

    const classIndex = this.form.controls.classIndex.value;

    if (classIndex === '') {
      this.form.patchValue({
        classCode: '',
        subjectCode: '',
        yearLevel: '',
        semester: '',
        schoolYear: new Date().getFullYear(),
      });
      return;
    }

    const selectedClass = this.classes[Number(classIndex)];

    if (!selectedClass) {
      return;
    }

    this.form.patchValue({
      classCode: selectedClass.classCode,
      subjectCode: selectedClass.subjectCode,
      yearLevel: selectedClass.yearLevel,
      semester: selectedClass.semester,
      schoolYear: selectedClass.schoolYear,
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedFile = undefined;
      return;
    }

    if (!this.acceptedMimeTypes.has(file.type)) {
      this.rejectSelectedFile(input, 'Only PDF, JPG, PNG, DOC, and DOCX files are allowed.');
      return;
    }

    if (file.size > this.maxFileSizeMb * 1024 * 1024) {
      this.rejectSelectedFile(input, `File must not exceed ${this.maxFileSizeMb}MB.`);
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.selectedFile = file;
  }

  upload(): void {
    if (this.form.invalid || !this.selectedFile) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please select a criterion and evidence file.';
      return;
    }

    if (!this.faculty?.facultyId) {
      this.errorMessage = 'No faculty member selected.';
      return;
    }

    const value = this.form.getRawValue();
    const selectedFile = this.selectedFile;

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const uploadPayload: UploadEvidencePayload = {
      facultyId: this.faculty.facultyId,
      criterion: value.criterion ?? '',
      file: selectedFile,
      classCode: value.classCode || undefined,
      subjectCode: value.subjectCode || undefined,
      yearLevel: value.yearLevel || undefined,
      semester: value.semester || undefined,
      schoolYear: value.schoolYear ?? undefined,
      description: value.description || undefined,
    };

    this.uploadProgress = 0;
    this.uploadStatusMessage = 'Preparing evidence upload...';
    this.toastFacade.showToast('Submitting evidence. Please keep this window open.', 'info');

    this.evidenceService
      .uploadEvidenceWithProgress(uploadPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.Sent) {
            this.uploadStatusMessage = 'Sending evidence to the server...';
            this.scheduleViewRefresh();
            return;
          }

          if (event.type === HttpEventType.UploadProgress) {
            this.uploadProgress = event.total
              ? Math.round((event.loaded / event.total) * 100)
              : this.uploadProgress;
            this.uploadStatusMessage = this.uploadProgress
              ? `Uploading evidence... ${this.uploadProgress}%`
              : 'Uploading evidence...';
            this.scheduleViewRefresh();
            return;
          }

          if (event.type !== HttpEventType.Response) {
            return;
          }

          const response = event.body;
          const message = response
            ? this.buildUploadSuccessMessage(response)
            : 'Evidence uploaded successfully.';

          this.isUploading = false;
          this.uploadProgress = 100;
          this.uploadStatusMessage = '';
          this.successMessage = message;
          this.toastFacade.showToast(message, 'success');
          this.resetAfterUpload();
          this.loadEvidences();
          this.scheduleViewRefresh();
        },
        error: (error) => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.uploadStatusMessage = '';
          this.errorMessage = this.extractApiMessage(error, 'Evidence upload failed.');
          this.toastFacade.showToast(this.errorMessage, 'error');
          this.scheduleViewRefresh();
        },
      });
  }

  applyFilters(): void {
    this.loadEvidences();
  }

  clearFilters(): void {
    this.filterForm.reset({
      criterion: '',
      classCode: '',
      subjectCode: '',
      semester: '',
      schoolYear: null,
    }, { emitEvent: false });
    this.loadEvidences();
  }

  download(evidence: FacultyEvidence): void {
    this.evidenceService
      .downloadEvidence(evidence.evidenceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const blob = response.body;

          if (!blob) {
            this.errorMessage = 'Downloaded file is empty.';
            this.scheduleViewRefresh();
            return;
          }

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');

          link.href = url;
          link.download = evidence.originalFilename;
          link.click();

          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          this.errorMessage = this.extractApiMessage(error, 'Evidence download failed.');
          this.scheduleViewRefresh();
        },
      });
  }

  requestDelete(evidence: FacultyEvidence): void {
    this.pendingDeleteEvidence = evidence;
    this.showDeleteConfirmation = true;
  }

  confirmDelete(): void {
    if (!this.pendingDeleteEvidence) {
      return;
    }

    const evidenceId = this.pendingDeleteEvidence.evidenceId;

    this.isDeleting = true;
    this.showDeleteConfirmation = false;

    this.evidenceService
      .deleteEvidence(evidenceId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting = false;
          this.pendingDeleteEvidence = undefined;
          this.successMessage = 'Evidence deleted.';
          this.toastFacade.showToast('Evidence deleted.', 'success');
          this.loadEvidences();
          this.scheduleViewRefresh();
        },
        error: (error) => {
          this.isDeleting = false;
          this.errorMessage = this.extractApiMessage(error, 'Unable to delete evidence.');
          this.toastFacade.showToast(this.errorMessage, 'error');
          this.scheduleViewRefresh();
        },
      });
  }

  closeDeleteConfirmation(): void {
    this.pendingDeleteEvidence = undefined;
    this.showDeleteConfirmation = false;
  }

  groupedCriteria(): CriteriaGroup[] {
    const groups = new Map<string, EvidenceCriterion[]>();

    this.criteria.forEach((criterion) => {
      const category = criterion.category || 'Other';
      groups.set(category, [...(groups.get(category) ?? []), criterion]);
    });

    return Array.from(groups.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }

  panelTitle(): string {
    if (this.selectedClass) {
      return `${this.selectedClass.subjectCode} Evidence`;
    }

    return 'Faculty Evidence';
  }

  panelSubtitle(): string {
    if (this.selectedClass) {
      return `${this.selectedClass.sectionCode} (${this.selectedClass.classCode}) evidence files`;
    }

    return 'Upload supporting files for evaluation criteria.';
  }

  isClassContextLocked(): boolean {
    return Boolean(this.selectedClass && !this.allowClassSelection);
  }

  uniqueClassCodes(): string[] {
    return this.uniqueClassValues('classCode');
  }

  uniqueSubjectCodes(): string[] {
    return this.uniqueClassValues('subjectCode');
  }

  uniqueSemesters(): string[] {
    return this.uniqueClassValues('semester');
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackCriterion(_: number, criterion: EvidenceCriterion): string {
    return criterion.name;
  }

  trackEvidence(_: number, evidence: FacultyEvidence): number {
    return evidence.evidenceId;
  }

  trackClass(index: number, cls: FacultyClass): string {
    return `${index}-${cls.classCode}-${cls.subjectCode}`;
  }

  private setSlice(slice: SliceResponse<FacultyEvidence>, append: boolean): void {
    this.evidences = append ? [...this.evidences, ...slice.content] : slice.content;
    this.currentPage = slice.page;
    this.pageSize = slice.size;
    this.hasNextEvidencePage = slice.hasNext;
  }

  private buildEvidenceFilters(page: number): EvidenceListFilters {
    const scopedClass = this.scopeToSelectedClass ? this.selectedClass : null;

    return {
      facultyId: this.faculty.facultyId,
      criterion: this.filterForm.controls.criterion.value || undefined,
      classCode: scopedClass?.classCode || this.filterForm.controls.classCode.value || undefined,
      subjectCode: scopedClass?.subjectCode || this.filterForm.controls.subjectCode.value || undefined,
      semester: scopedClass?.semester || this.filterForm.controls.semester.value || undefined,
      schoolYear: this.filterForm.controls.schoolYear.value ?? undefined,
      page,
      size: this.pageSize,
    };
  }

  private watchFilterChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.loadEvidences();
      });
  }

  private scheduleViewRefresh(): void {
    queueMicrotask(() => {
      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    });
  }

  private rejectSelectedFile(input: HTMLInputElement, message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    input.value = '';
    this.selectedFile = undefined;
  }

  private resetAfterUpload(): void {
    this.selectedFile = undefined;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    this.form.patchValue({
      criterion: '',
      description: '',
    });
    this.applySelectedClassContext();
    this.form.markAsPristine();
  }

  private resetFormContext(): void {
    this.selectedFile = undefined;

    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }

    this.filterForm.reset({
      criterion: '',
      classCode: '',
      subjectCode: '',
      semester: '',
      schoolYear: null,
    }, { emitEvent: false });
    this.form.reset({
      criterion: '',
      classIndex: '',
      classCode: '',
      subjectCode: '',
      yearLevel: '',
      semester: '',
      schoolYear: new Date().getFullYear(),
      description: '',
    });
    this.applySelectedClassContext();
  }

  private uniqueClassValues(key: 'classCode' | 'subjectCode' | 'semester'): string[] {
    return Array.from(
      new Set(
        this.classes
          .map((cls) => cls[key])
          .filter((value): value is string => Boolean(value))
      )
    );
  }

  private applySelectedClassContext(): void {
    if (!this.selectedClass) {
      return;
    }

    this.form.patchValue({
      classIndex: '',
      classCode: this.selectedClass.classCode,
      subjectCode: this.selectedClass.subjectCode,
      yearLevel: this.selectedClass.yearLevel,
      semester: this.selectedClass.semester,
      schoolYear: this.selectedClass.schoolYear,
    });
  }

  private buildUploadSuccessMessage(response: FacultyEvidence): string {
    const apiMessage = (response as FacultyEvidence & { message?: string }).message;

    if (apiMessage) {
      return apiMessage;
    }

    const filename = response.originalFilename || 'Evidence file';
    const criterion = response.criterionLabel || response.criterion || 'selected criterion';

    return `${filename} uploaded for ${criterion}.`;
  }

  private extractApiMessage(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const body = error.error;

    if (typeof body === 'string') {
      return body || fallback;
    }

    if (body && typeof body === 'object') {
      const apiError = body as {
        message?: unknown;
        error?: unknown;
        detail?: unknown;
        title?: unknown;
        errors?: unknown;
      };
      const validationMessage = this.extractValidationErrors(apiError.errors);

      if (validationMessage) {
        return validationMessage;
      }

      for (const key of ['message', 'error', 'detail', 'title'] as const) {
        const value = apiError[key];

        if (typeof value === 'string' && value.trim()) {
          return value;
        }
      }
    }

    return error.message || fallback;
  }

  private extractValidationErrors(errors: unknown): string {
    if (!errors || typeof errors !== 'object') {
      return '';
    }

    if (Array.isArray(errors)) {
      return errors.filter((error): error is string => typeof error === 'string').join(' ');
    }

    return Object.values(errors)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((value): value is string => typeof value === 'string')
      .join(' ');
  }
}
