import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import {
  FacultyLoadDTO,
  FacultyClass,
} from '../../../core/services/supervisor-data/supervisor-data-service';
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-faculty-evaluation-modal-component',
  imports: [CommonModule],
  templateUrl: './faculty-evaluation-modal-component.html',
  styleUrl: './faculty-evaluation-modal-component.css',
})
export class FacultyEvaluationModalComponent {
  @Input()
  faculty!: FacultyLoadDTO | null;

  @Input()
  facultyClasses: any;

  @Input()
  evaluationStatus: any;

  @Input()
  buildEvaluationKey!: (
    classCode: string,
    subjectCode: string,
    yearLevel: string,
    semester: string,
    schoolYear: number,
  ) => string;

  @Input()
  getFacultyInitials!: (faculty: FacultyLoadDTO) => string;

  @Input()
  getCampusName!: (campus: string) => string;

  @Input()
  trackClass!: (index: number, cls: FacultyClass) => string;

  @Output()
  close = new EventEmitter<void>();

  @Output()
  evaluate = new EventEmitter<{
    cls: FacultyClass;
    faculty: FacultyLoadDTO;
  }>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeModal();
  }

  onEvaluate(cls: FacultyClass, faculty: FacultyLoadDTO): void {
    this.evaluate.emit({
      cls,
      faculty,
    });
  }

  closeModal(): void {
    this.close.emit();
  }
}
