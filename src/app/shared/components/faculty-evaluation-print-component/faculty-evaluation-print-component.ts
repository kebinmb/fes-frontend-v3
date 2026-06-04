import { Component, Input } from '@angular/core';
export interface FacultyEvaluationPrintRecord {
  facultyEvaluationScoreId: number;

  facultyId: string;
  facultyName?: string;

  evaluatorId?: string;
  evaluatorType?: string;

  college: string;
  position: string;

  classCode: string;
  sectionCode?: string;
  programCode?: string;
  subjectCode?: string;

  semester?: string;
  schoolYear?: number;
  yearLevel?: string;

  overallAverageScore: number;
  overallInterpretation?: string;

  numberOfStudents?: number;

  setRating?: number;
  sefRating?: number;

  studentComments?: string;
  supervisorComments?: string;
}
@Component({
  selector: 'app-faculty-evaluation-print-component',
  imports: [],
  templateUrl: './faculty-evaluation-print-component.html',
  styleUrl: './faculty-evaluation-print-component.css',
})
export class FacultyEvaluationPrintComponent {
  @Input()
  data: FacultyEvaluationPrintRecord[] = [];

  faculty: FacultyEvaluationPrintRecord | null = null;

  setData: FacultyEvaluationPrintRecord[] = [];

  sefData: FacultyEvaluationPrintRecord[] = [];

  totalStudents = 0;

  totalWeightedScore = 0;

  overallSetRating = 0;

  overallSefRating = 0;

  ngOnInit(): void {
    const storedData = localStorage.getItem('faculty-print-data');
    if (storedData && !this.data.length) {
      this.data = JSON.parse(storedData);
    }
    if (!this.data.length) {
      return;
    }
    this.faculty = this.data[0];
    this.setData = this.data.filter((item) => (item.setRating ?? 0) > 0);
    this.sefData = this.data.filter((item) => (item.sefRating ?? 0) > 0);
    this.computeTotals();
    setTimeout(() => {
      window.print();
    }, 500);
  }

  private computeTotals(): void {
    this.totalStudents = this.setData.reduce(
      (total, item) => total + (item.numberOfStudents ?? 0),
      0,
    );

    this.totalWeightedScore = this.setData.reduce((total, item) => {
      return total + (item.numberOfStudents ?? 0) * (item.setRating ?? 0);
    }, 0);

    this.overallSetRating =
      this.totalStudents > 0 ? this.totalWeightedScore / this.totalStudents : 0;

    this.overallSefRating =
      this.sefData.length > 0
        ? this.sefData.reduce((total, item) => total + (item.sefRating ?? 0), 0) /
          this.sefData.length
        : 0;
  }

  get studentComments() {
    return this.data.filter((item) => item.studentComments && item.studentComments !== '-');
  }

  get supervisorComments() {
    return this.data.filter((item) => item.supervisorComments && item.supervisorComments !== '-');
  }
  cleanSubjectCode(subjectCode: string | null | undefined): string {
    return (
      subjectCode
        ?.replace(/(ALI|TAL|BIN|FT)-?/g, '')
        .replace(/\s+/g, ' ')
        .trim() || ''
    );
  }
}
