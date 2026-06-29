import { CommonModule } from '@angular/common';
import {
  Component,
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
  PageResponse,
} from '@app/models/faculty-evidence.model';
import { FacultyEvidenceService } from '@app/services/faculty-evidence.service';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal-component/confirmation-modal-component';
import { ToastFacade } from '@core/store/toast/toast.facade';

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

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;

  private readonly fb = inject(FormBuilder);
  private readonly evidenceService = inject(FacultyEvidenceService);
  private readonly toastFacade = inject(ToastFacade);

  readonly maxFileSizeMb = 10;
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
  pageSize = 5;
  totalPages = 0;
  totalElements = 0;
  isCriteriaLoading = false;
  isEvidenceLoading = false;
  isUploading = false;
  isDeleting = false;
  errorMessage = '';
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
    this.loadCriteria();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['faculty'] && this.faculty?.facultyId) {
      this.currentPage = 0;
      this.resetFormContext();
      this.loadEvidences();
    }
  }

  loadCriteria(): void {
    this.isCriteriaLoading = true;
    this.errorMessage = '';

    this.evidenceService.getCriteria().subscribe({
      next: (criteria) => {
        this.criteria = criteria;
        this.isCriteriaLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load evidence criteria.';
        this.isCriteriaLoading = false;
      },
    });
  }

  loadEvidences(): void {
    if (!this.faculty?.facultyId) {
      return;
    }

    this.isEvidenceLoading = true;

    this.evidenceService
      .getEvidenceList({
        facultyId: this.faculty.facultyId,
        criterion: this.filterForm.controls.criterion.value || undefined,
        classCode: this.filterForm.controls.classCode.value || undefined,
        subjectCode: this.filterForm.controls.subjectCode.value || undefined,
        semester: this.filterForm.controls.semester.value || undefined,
        schoolYear: this.filterForm.controls.schoolYear.value ?? undefined,
        page: this.currentPage,
        size: this.pageSize,
      })
      .subscribe({
        next: (page) => {
          this.setPage(page);
          this.isEvidenceLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load evidence records.';
          this.isEvidenceLoading = false;
        },
      });
  }

  onClassContextChange(): void {
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

    this.isUploading = true;
    this.errorMessage = '';

    this.evidenceService
      .uploadEvidence({
        facultyId: this.faculty.facultyId,
        criterion: value.criterion ?? '',
        file: this.selectedFile,
        classCode: value.classCode || undefined,
        subjectCode: value.subjectCode || undefined,
        yearLevel: value.yearLevel || undefined,
        semester: value.semester || undefined,
        schoolYear: value.schoolYear ?? undefined,
        description: value.description || undefined,
      })
      .subscribe({
        next: () => {
          this.isUploading = false;
          this.toastFacade.showToast('Evidence uploaded successfully.', 'success');
          this.resetAfterUpload();
          this.loadEvidences();
        },
        error: () => {
          this.isUploading = false;
          this.errorMessage = 'Evidence upload failed.';
        },
      });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadEvidences();
  }

  clearFilters(): void {
    this.filterForm.reset({
      criterion: '',
      classCode: '',
      subjectCode: '',
      semester: '',
      schoolYear: null,
    });
    this.currentPage = 0;
    this.loadEvidences();
  }

  download(evidence: FacultyEvidence): void {
    this.evidenceService.downloadEvidence(evidence.evidenceId).subscribe({
      next: (response) => {
        const blob = response.body;

        if (!blob) {
          this.errorMessage = 'Downloaded file is empty.';
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = evidence.originalFilename;
        link.click();

        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage = 'Evidence download failed.';
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

    this.evidenceService.deleteEvidence(evidenceId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.pendingDeleteEvidence = undefined;
        this.toastFacade.showToast('Evidence deleted.', 'success');
        this.loadEvidences();
      },
      error: () => {
        this.isDeleting = false;
        this.errorMessage = 'Unable to delete evidence.';
      },
    });
  }

  closeDeleteConfirmation(): void {
    this.pendingDeleteEvidence = undefined;
    this.showDeleteConfirmation = false;
  }

  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;
    this.loadEvidences();
  }

  nextPage(): void {
    if (this.currentPage + 1 >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.loadEvidences();
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

  private setPage(page: PageResponse<FacultyEvidence>): void {
    this.evidences = page.content;
    this.totalElements = page.totalElements;
    this.totalPages = page.totalPages;
    this.currentPage = page.number;
    this.pageSize = page.size;
  }

  private rejectSelectedFile(input: HTMLInputElement, message: string): void {
    this.errorMessage = message;
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
    });
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
}
