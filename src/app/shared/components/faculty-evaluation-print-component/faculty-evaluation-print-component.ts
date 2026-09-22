import { ChangeDetectionStrategy, Component, Input, OnInit, signal } from '@angular/core';
import { PrintScoreFormat } from '@app/models';
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
  numberOfSupervisors?: number | null;

  setRating?: number | null;
  sefRating?: number | null;

  studentComments?: string | null;
  supervisorComments?: string | null;
  supervisorName?: string | null;
  supervisorDesignation?: string | null;
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

interface FacultyEvaluationPrintReportPayload {
  report?: Partial<FacultyEvaluationPrintReportMeta> | null;
  items?: FacultyEvaluationPrintRecord[];
}

export type FacultyEvaluationPrintMode = 'report' | 'annex' | 'report-annex';

export interface FacultyEvaluationPrintPayload extends FacultyEvaluationPrintReportPayload {
  scoreFormat?: PrintScoreFormat;
  mode?: FacultyEvaluationPrintMode;
  bulk?: boolean;
  reports?: FacultyEvaluationPrintReportPayload[];
}

interface FacultyEvaluationPrintSection {
  report: Partial<FacultyEvaluationPrintReportMeta> | null;
  data: FacultyEvaluationPrintRecord[];
  faculty: FacultyEvaluationPrintRecord | null;
  setData: FacultyEvaluationPrintRecord[];
  sefData: FacultyEvaluationPrintRecord[];
  totalStudents: number;
  totalWeightedScore: number;
  overallSetRating: number;
  overallSefRating: number;
  studentComments: PrintCommentRow[];
  supervisorComments: PrintCommentRow[];
  supervisorName: string;
  supervisorDesignation: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-faculty-evaluation-print-component',
  imports: [UnicodeTextPipe],
  templateUrl: './faculty-evaluation-print-component.html',
  styleUrl: './faculty-evaluation-print-component.css',
})
export class FacultyEvaluationPrintComponent implements OnInit {
  private static readonly CHUNK_SIZE = 5;

  @Input()
  data: FacultyEvaluationPrintRecord[] = [];

  readonly PrintScoreFormat = PrintScoreFormat;
  readonly scoreFormat = signal<PrintScoreFormat>(PrintScoreFormat.PERCENTAGE);
  readonly renderedSections = signal<FacultyEvaluationPrintSection[]>([]);
  readonly isRendering = signal<boolean>(false);
  readonly renderProgress = signal<number>(0);

  sections: FacultyEvaluationPrintSection[] = [];
  printMode: FacultyEvaluationPrintMode = 'report';
  isBulkAnnexPrint = false;

  ngOnInit(): void {
    this.sections = this.readPrintPayload()
      .map((payload) => this.buildSection(payload))
      .filter((section) => section.data.length);

    if (!this.sections.length) {
      return;
    }

    if (this.sections.length <= FacultyEvaluationPrintComponent.CHUNK_SIZE) {
      this.renderedSections.set(this.sections);
      this.schedulePrint();
      return;
    }

    this.renderInChunks();
  }

  private renderInChunks(): void {
    this.isRendering.set(true);
    this.renderProgress.set(0);
    this.renderedSections.set([]);

    const total = this.sections.length;
    let currentIndex = 0;

    const renderNextBatch = () => {
      const nextIndex = Math.min(
        currentIndex + FacultyEvaluationPrintComponent.CHUNK_SIZE,
        total,
      );
      const chunk = this.sections.slice(0, nextIndex);
      this.renderedSections.set(chunk);
      currentIndex = nextIndex;

      const percent = Math.round((currentIndex / total) * 100);
      this.renderProgress.set(percent);

      if (currentIndex < total) {
        requestAnimationFrame(() => {
          setTimeout(renderNextBatch, 16);
        });
      } else {
        this.isRendering.set(false);
        this.schedulePrint();
      }
    };

    renderNextBatch();
  }

  private schedulePrint(): void {
    setTimeout(() => {
      window.print();
    }, 500);
  }

  showReport(): boolean {
    return this.printMode === 'report' || this.printMode === 'report-annex';
  }

  showAnnex(): boolean {
    return this.printMode === 'annex' || this.printMode === 'report-annex';
  }

  suppressAnnexPageNumber(): boolean {
    return this.printMode === 'annex' && this.isBulkAnnexPrint;
  }

  setScoreFormat(format: PrintScoreFormat): void {
    this.scoreFormat.set(format);
  }

  triggerPrint(): void {
    window.print();
  }

  formatRating(score: number | null | undefined): string {
    const raw = this.safeNumber(score);
    if (this.scoreFormat() === PrintScoreFormat.LIKERT) {
      return (raw / 20).toFixed(2);
    }
    return raw.toFixed(2);
  }

  formatWeightedScore(item: FacultyEvaluationPrintRecord): string {
    const students = this.safeNumber(item.numberOfStudents);
    const rating = this.safeNumber(item.setRating);
    if (this.scoreFormat() === PrintScoreFormat.LIKERT) {
      return (students * (rating / 20)).toFixed(2);
    }
    return (students * rating).toFixed(2);
  }

  formatTotalWeightedScore(section: FacultyEvaluationPrintSection): string {
    if (this.scoreFormat() === PrintScoreFormat.LIKERT) {
      return (section.totalWeightedScore / 20).toFixed(2);
    }
    return section.totalWeightedScore.toFixed(2);
  }

  formatOverallSet(section: FacultyEvaluationPrintSection): string {
    if (this.scoreFormat() === PrintScoreFormat.LIKERT) {
      return (section.overallSetRating / 20).toFixed(2);
    }
    return section.overallSetRating.toFixed(2);
  }

  formatOverallSef(section: FacultyEvaluationPrintSection): string {
    if (this.scoreFormat() === PrintScoreFormat.LIKERT) {
      return (section.overallSefRating / 20).toFixed(2);
    }
    return section.overallSefRating.toFixed(2);
  }

  private readPrintPayload(): FacultyEvaluationPrintReportPayload[] {
    const storedData = localStorage.getItem('faculty-print-data');
    localStorage.removeItem('faculty-print-data');

    if (!storedData) {
      return this.data.length ? [{ items: this.data }] : [];
    }

    try {
      const parsed = repairSpecialCharacters(
        JSON.parse(storedData),
      ) as FacultyEvaluationPrintPayload | FacultyEvaluationPrintRecord[];

      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        'scoreFormat' in parsed &&
        parsed.scoreFormat
      ) {
        this.scoreFormat.set(parsed.scoreFormat as PrintScoreFormat);
      }

      if (Array.isArray(parsed)) {
        return [{ items: parsed }];
      }

      this.printMode = this.normalizePrintMode(parsed?.mode);
      const reports = Array.isArray(parsed?.reports) ? parsed.reports : null;
      this.isBulkAnnexPrint =
        this.printMode === 'annex' && (parsed?.bulk === true || (reports?.length ?? 0) > 1);

      if (reports) {
        return reports;
      }

      return [
        {
          report: parsed?.report,
          items: Array.isArray(parsed?.items) ? parsed.items : [],
        },
      ];
    } catch {
      return this.data.length ? [{ items: this.data }] : [];
    }
  }

  private normalizePrintMode(mode: unknown): FacultyEvaluationPrintMode {
    return mode === 'annex' || mode === 'report-annex' ? mode : 'report';
  }

  private buildSection(
    payload: FacultyEvaluationPrintReportPayload,
  ): FacultyEvaluationPrintSection {
    const data = this.normalizeRecords(payload.items ?? []);
    const faculty = data[0] ?? null;
    const setData = data.filter((item) => (item.setRating ?? 0) > 0);
    const sefData = data.filter((item) => (item.sefRating ?? 0) > 0);
    const totals = this.computeTotals(setData, sefData);

    return {
      report: this.normalizeReport(payload.report ?? undefined),
      data,
      faculty,
      setData,
      sefData,
      ...totals,
      studentComments: this.collectUniqueComments(data, 'studentComments'),
      supervisorComments: this.collectUniqueComments(data, 'supervisorComments'),
      supervisorName: this.firstRecordValue(data, 'supervisorName'),
      supervisorDesignation: this.firstRecordValue(data, 'supervisorDesignation'),
    };
  }

  private computeTotals(
    setData: FacultyEvaluationPrintRecord[],
    sefData: FacultyEvaluationPrintRecord[],
  ): Pick<
    FacultyEvaluationPrintSection,
    'totalStudents' | 'totalWeightedScore' | 'overallSetRating' | 'overallSefRating'
  > {
    const totalStudents = setData.reduce(
      (total, item) => total + this.safeNumber(item.numberOfStudents),
      0,
    );

    const totalWeightedScore = setData.reduce((total, item) => {
      return total + this.safeNumber(item.numberOfStudents) * this.safeNumber(item.setRating);
    }, 0);

    return {
      totalStudents,
      totalWeightedScore,
      overallSetRating: totalStudents > 0 ? totalWeightedScore / totalStudents : 0,
      overallSefRating:
        sefData.length > 0
          ? sefData.reduce((total, item) => total + this.safeNumber(item.sefRating), 0) /
            sefData.length
          : 0,
    };
  }

  private collectUniqueComments(
    records: FacultyEvaluationPrintRecord[],
    commentKey: 'studentComments' | 'supervisorComments',
  ): PrintCommentRow[] {
    const uniqueComments = new Map<string, string>();

    records
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
      .split(/\r?\n|(?:\s*\|\s*)|(?:\s*;\s*)|(?:\s*â€¢\s*)/)
      .map((comment) => comment.replace(/[ \t]+/g, ' ').trim())
      .filter((comment) => comment && comment !== '-');
  }

  private firstRecordValue(
    records: FacultyEvaluationPrintRecord[],
    key: 'supervisorName' | 'supervisorDesignation',
  ): string {
    return records
      .map((record) => this.safeText(record[key], ''))
      .find((value) => !!value) ?? '';
  }

  cleanSubjectCode(subjectCode: string | null | undefined): string {
    return (
      this.safeText(subjectCode, '')
        ?.replace(/(ALI|TAL|BIN|FT)-?/g, '')
        .replace(/\s+/g, ' ')
        .trim() || ''
    );
  }

  trackPrintSection(index: number, section: FacultyEvaluationPrintSection): string | number {
    return section.report?.reportId ?? section.faculty?.facultyId ?? index;
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

  academicTerm(section: FacultyEvaluationPrintSection): string {
    const semester = this.safeText(section.faculty?.semester, '');
    const schoolYear = this.academicYearRange(section.faculty?.schoolYear);

    if (!semester && !schoolYear) {
      return '-';
    }

    return `${semester || '-'} Semester / ${schoolYear || '-'}`;
  }

  private academicYearRange(schoolYear: number | string | null | undefined): string {
    const rawSchoolYear = this.safeText(schoolYear, '');

    if (!rawSchoolYear) {
      return '';
    }

    const startYear = Number(rawSchoolYear.match(/\d{4}/)?.[0]);

    if (!Number.isFinite(startYear)) {
      return rawSchoolYear;
    }

    return `${startYear} - ${startYear + 1}`;
  }

  hasReportVerification(
    report: Partial<FacultyEvaluationPrintReportMeta> | null,
  ): boolean {
    return !!(
      report?.reportId ||
      report?.reportHash ||
      report?.verificationUrl ||
      report?.qrCodeDataUri
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
        numberOfSupervisors: this.safeNumber(item.numberOfSupervisors),
        setRating: this.safeNumber(item.setRating),
        sefRating: this.safeNumber(item.sefRating),
        studentComments: this.safeText(item.studentComments, ''),
        supervisorComments: this.safeText(item.supervisorComments, ''),
        supervisorName: this.safeText(item.supervisorName, ''),
        supervisorDesignation: this.safeText(item.supervisorDesignation, ''),
      }));
  }

  private normalizeReport(
    report: Partial<FacultyEvaluationPrintReportMeta> | undefined,
  ): Partial<FacultyEvaluationPrintReportMeta> | null {
    if (!report) {
      return null;
    }

    return {
      reportId: this.safeText(report.reportId, ''),
      reportHash: this.safeText(report.reportHash, ''),
      verificationUrl: this.frontendVerificationUrl(report.reportId, report.verificationUrl),
      qrCodeDataUri: this.safeText(report.qrCodeDataUri, ''),
      versionNumber: this.safeNumber(report.versionNumber, 0),
      status: this.safeText(report.status, ''),
      generatedAt: this.safeText(report.generatedAt, ''),
      generatedByUsername: this.safeText(report.generatedByUsername, ''),
    };
  }

  private frontendVerificationUrl(
    reportId: string | null | undefined,
    fallbackUrl: string | null | undefined,
  ): string {
    const resolvedReportId = this.safeText(reportId, '') ||
      this.reportIdFromVerificationUrl(fallbackUrl);

    if (!resolvedReportId) {
      return this.safeText(fallbackUrl, '');
    }

    return `${window.location.origin}/verify-report/${encodeURIComponent(resolvedReportId)}`;
  }

  private reportIdFromVerificationUrl(url: string | null | undefined): string {
    const text = this.safeText(url, '');

    if (!text) {
      return '';
    }

    const match = text.match(/\/verify-report\/([^/?#]+)/);

    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }
}
