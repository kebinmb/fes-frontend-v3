import { Component, Input } from '@angular/core';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { repairSpecialCharacters } from '@utilities/normalize-text';
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

interface PrintCommentRow {
  id: string;
  comment: string;
}

@Component({
  selector: 'app-faculty-evaluation-print-component',
  imports: [UnicodeTextPipe],
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
      this.data = repairSpecialCharacters(JSON.parse(storedData));
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

  get studentComments(): PrintCommentRow[] {
    return this.collectUniqueComments('studentComments');
  }

  get supervisorComments(): PrintCommentRow[] {
    return this.collectUniqueComments('supervisorComments');
  }

  private collectUniqueComments(
    commentKey: 'studentComments' | 'supervisorComments',
  ): PrintCommentRow[] {
    const uniqueComments = new Map<string, string>();

    this.data
      .flatMap((item) => this.splitComments(item[commentKey]))
      .forEach((comment) => {
        const uniqueKey = comment.toLocaleLowerCase();

        if (!uniqueComments.has(uniqueKey)) {
          uniqueComments.set(uniqueKey, comment);
        }
      });

    return Array.from(uniqueComments.values()).map((comment, index) => ({
      id: `${commentKey}-${index}-${comment}`,
      comment,
    }));
  }

  private splitComments(comments: string | null | undefined): string[] {
    if (!comments || comments.trim() === '-') {
      return [];
    }

    return repairSpecialCharacters(comments)
      .split(/\r?\n|(?:\s*\|\s*)|(?:\s*;\s*)|(?:\s*•\s*)/)
      .map((comment) => comment.replace(/[ \t]+/g, ' ').trim())
      .filter((comment) => comment && comment !== '-');
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
