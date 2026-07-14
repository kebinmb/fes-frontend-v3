import { Component, Input } from '@angular/core';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { repairSpecialCharacters } from '@utilities/normalize-text';
export interface FacultyEvaluationPrintRecord {
  facultyEvaluationScoreId?: number | null;

  facultyId?: string | null;
  facultyName?: string | null;

  evaluatorId?: string | null;
  evaluatorType?: string | null;

  college?: string | null;
  position?: string | null;

  classCode?: string | null;
  sectionCode?: string | null;
  programCode?: string | null;
  subjectCode?: string | null;

  semester?: string | null;
  schoolYear?: number | null;
  yearLevel?: string | null;

  overallAverageScore?: number | null;
  overallInterpretation?: string | null;

  numberOfStudents?: number | null;

  setRating?: number | null;
  sefRating?: number | null;

  studentComments?: string | null;
  supervisorComments?: string | null;
}

interface PrintCommentRow {
  id: string;
  comment: string;
}

interface FacultyEvaluationPrintReportMeta {
  reportId: string;
  reportHash: string;
  verificationUrl: string;
  qrCodeDataUri: string;
  versionNumber: number;
  status: string;
  generatedAt: string;
  generatedByUsername?: string | null;
}

interface FacultyEvaluationPrintPayload {
  report?: FacultyEvaluationPrintReportMeta;
  items?: FacultyEvaluationPrintRecord[];
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

  report: Partial<FacultyEvaluationPrintReportMeta> | null = null;

  faculty: FacultyEvaluationPrintRecord | null = null;

  setData: FacultyEvaluationPrintRecord[] = [];

  sefData: FacultyEvaluationPrintRecord[] = [];

  totalStudents = 0;

  totalWeightedScore = 0;

  overallSetRating = 0;

  overallSefRating = 0;

  ngOnInit(): void {
    const storedData = localStorage.getItem('faculty-print-data');
    localStorage.removeItem('faculty-print-data');
    if (storedData && !this.data.length) {
      try {
        const parsed = repairSpecialCharacters(
          JSON.parse(storedData),
        ) as FacultyEvaluationPrintPayload | FacultyEvaluationPrintRecord[];

        if (Array.isArray(parsed)) {
          this.data = parsed;
        } else {
          this.report = this.normalizeReport(parsed?.report);
          this.data = Array.isArray(parsed?.items) ? parsed.items : [];
        }
      } catch {
        this.data = [];
        this.report = null;
      }
    }

    this.data = this.normalizeRecords(this.data);

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
      (total, item) => total + this.safeNumber(item.numberOfStudents),
      0,
    );

    this.totalWeightedScore = this.setData.reduce((total, item) => {
      return total + this.safeNumber(item.numberOfStudents) * this.safeNumber(item.setRating);
    }, 0);

    this.overallSetRating =
      this.totalStudents > 0 ? this.totalWeightedScore / this.totalStudents : 0;

    this.overallSefRating =
      this.sefData.length > 0
        ? this.sefData.reduce((total, item) => total + this.safeNumber(item.sefRating), 0) /
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
      this.safeText(subjectCode, '')
        ?.replace(/(ALI|TAL|BIN|FT)-?/g, '')
        .replace(/\s+/g, ' ')
        .trim() || ''
    );
  }

  trackEvaluationRecord(index: number, item: FacultyEvaluationPrintRecord): string {
    return `${item.facultyEvaluationScoreId ?? item.classCode ?? 'record'}-${index}`;
  }

  safeText(value: unknown, fallback = '-'): string {
    if (value === null || value === undefined) {
      return fallback;
    }

    const text = repairSpecialCharacters(String(value)).trim();

    if (!text || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined') {
      return fallback;
    }

    return text;
  }

  safeNumber(value: unknown, fallback = 0): number {
    if (value === null || value === undefined || value === '') {
      return fallback;
    }

    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  formattedNumber(value: unknown): string {
    return this.safeNumber(value).toFixed(2);
  }

  weightedScore(item: FacultyEvaluationPrintRecord): string {
    return (
      this.safeNumber(item.numberOfStudents) *
      this.safeNumber(item.setRating)
    ).toFixed(2);
  }

  yearSection(item: FacultyEvaluationPrintRecord): string {
    const program = this.safeText(item.programCode, '');
    const yearLevel = this.safeText(item.yearLevel, '');
    const section = this.safeText(item.sectionCode, '');
    const parts = [program, yearLevel, section].filter(Boolean);

    return parts.length ? parts.join(' - ') : '-';
  }

  academicTerm(): string {
    const semester = this.safeText(this.faculty?.semester, '');
    const schoolYear = this.safeText(this.faculty?.schoolYear, '');

    if (!semester && !schoolYear) {
      return '-';
    }

    return `${semester || '-'} Semester / ${schoolYear || '-'}`;
  }

  hasReportVerification(): boolean {
    return !!(
      this.report?.reportId ||
      this.report?.reportHash ||
      this.report?.verificationUrl ||
      this.report?.qrCodeDataUri
    );
  }

  private normalizeRecords(records: FacultyEvaluationPrintRecord[]): FacultyEvaluationPrintRecord[] {
    if (!Array.isArray(records)) {
      return [];
    }

    return records
      .filter((item): item is FacultyEvaluationPrintRecord => !!item && typeof item === 'object')
      .map((item) => ({
        ...item,
        facultyEvaluationScoreId: this.safeNumber(item.facultyEvaluationScoreId, 0),
        facultyId: this.safeText(item.facultyId, ''),
        facultyName: this.safeText(item.facultyName, ''),
        evaluatorId: this.safeText(item.evaluatorId, ''),
        evaluatorType: this.safeText(item.evaluatorType, ''),
        college: this.safeText(item.college, ''),
        position: this.safeText(item.position, ''),
        classCode: this.safeText(item.classCode, ''),
        sectionCode: this.safeText(item.sectionCode, ''),
        programCode: this.safeText(item.programCode, ''),
        subjectCode: this.safeText(item.subjectCode, ''),
        semester: this.safeText(item.semester, ''),
        schoolYear: this.safeNumber(item.schoolYear, 0) || null,
        yearLevel: this.safeText(item.yearLevel, ''),
        overallAverageScore: this.safeNumber(item.overallAverageScore),
        numberOfStudents: this.safeNumber(item.numberOfStudents),
        setRating: this.safeNumber(item.setRating),
        sefRating: this.safeNumber(item.sefRating),
        studentComments: this.safeText(item.studentComments, ''),
        supervisorComments: this.safeText(item.supervisorComments, ''),
      }));
  }

  private normalizeReport(
    report: FacultyEvaluationPrintReportMeta | undefined,
  ): Partial<FacultyEvaluationPrintReportMeta> | null {
    if (!report) {
      return null;
    }

    return {
      reportId: this.safeText(report.reportId, ''),
      reportHash: this.safeText(report.reportHash, ''),
      verificationUrl: this.safeText(report.verificationUrl, ''),
      qrCodeDataUri: this.safeText(report.qrCodeDataUri, ''),
      versionNumber: this.safeNumber(report.versionNumber, 0),
      status: this.safeText(report.status, ''),
      generatedAt: this.safeText(report.generatedAt, ''),
      generatedByUsername: this.safeText(report.generatedByUsername, ''),
    };
  }
}
