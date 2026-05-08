import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';
import { FetchFacultyResponse } from '../../../services/admin/admin-service';
import { debounceTime, Subject, take } from 'rxjs';
import * as AdminDataActions from './../../../store/admin-data/admin-data.actions';
import { Actions, ofType } from '@ngrx/effects';
export interface FacultyEvaluationPrintRecord {
  facultyEvaluationScoreId: number;
  facultyId: string;
  college: string;
  position: string;
  facultyName?: string;
  evaluatorId?: string;
  classCode: string;
  semester?: string;
  schoolYear?: number;
  subjectCode?: string;
  yearLevel?: string;
  commentsOrFeedbacks?: string;
  overallAverageScore: number;
  overallInterpretation?: string;
  numberOfStudents?: number;
  sefRating?: number;
}
@Component({
  selector: 'app-faculty-data-table-component',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, FormsModule],
  templateUrl: './faculty-data-table-component.html',
  styleUrl: './faculty-data-table-component.css',
})
export class FacultyDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  private fb = inject(FormBuilder);
  private searchSubject = new Subject<string>();
  private actions$ = inject(Actions);
  faculties$ = this.adminDataFacade.faculties$;
  updateFacultyMessage$ = this.adminDataFacade.updateFacultyMessage$;
  selectedFaculty: FetchFacultyResponse | null = null;
  searchTerm = '';
  currentPage = 0;
  pageSize = 10;
  facultyForm: FormGroup = this.fb.group({
    facultyId: ['', Validators.required],
    firstname: ['', [Validators.required, Validators.minLength(2)]],
    middlename: [''],
    lastname: ['', [Validators.required, Validators.minLength(2)]],
    position: ['', Validators.required],
    loadLimit: [0, [Validators.required, Validators.min(1)]],
    college: ['', Validators.required],
    status: ['', Validators.required],
  });
  ngOnInit(): void {
    this.loadFaculties();
    this.searchSubject.pipe(debounceTime(400)).subscribe((value) => {
      this.searchTerm = value;
      this.currentPage = 0;
      this.loadFaculties();
    });
  }
  loadFaculties(): void {
    this.adminDataFacade.loadFaculties(this.currentPage, this.pageSize, this.searchTerm);
  }
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }
  onSearch(): void {
    this.currentPage = 0;
    this.loadFaculties();
  }
  onFacultyPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.currentPage = page;
    this.loadFaculties();
  }
  openEditModal(faculty: FetchFacultyResponse): void {
    this.selectedFaculty = faculty;
    this.facultyForm.patchValue({
      facultyId: faculty.facultyId,
      firstname: faculty.firstname,
      middlename: faculty.middlename,
      lastname: faculty.lastname,
      position: faculty.position,
      loadLimit: Number(faculty.loadLimit),
      college: faculty.college,
      status: faculty.status,
    });
  }
  closeEditModal(): void {
    this.selectedFaculty = null;
    this.facultyForm.reset();
  }
  updateFaculty(): void {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      return;
    }
    this.adminDataFacade.updateFaculty(this.facultyForm.value);
    this.closeEditModal();
  }
  get f() {
    return this.facultyForm.controls;
  }
  printSingle(record: FacultyEvaluationPrintRecord): void {
    this.adminDataFacade.loadFacultyEvaluationScoresByFacultyId(
      record.facultyId
    );
    this.actions$
      .pipe(
        ofType(
          AdminDataActions.loadFacultyEvaluationScoresByFacultyIdSuccess
        ),
        take(1)
      )
      .subscribe(({ response }) => {
        const normalizedData: FacultyEvaluationPrintRecord[] =
          response.map((item) => ({
            facultyEvaluationScoreId:
              item.facultyEvaluationScoreId,
            facultyId:
              item.facultyId,
            facultyName:
              item.facultyName ?? record.facultyName,
            evaluatorId:
              item.evaluatorId,
            classCode:
              item.classCode,
            college:
              item.college,
            position:
              item.position,
            semester:
              item.semester,
            schoolYear:
              item.schoolYear,
            subjectCode:
              item.subjectCode,
            yearLevel:
              item.yearLevel ?? '-',
            commentsOrFeedbacks:
              item.comments ?? '-',
            overallAverageScore:
              item.overallAverageScore,
            overallInterpretation:
              item.overallInterpretation,
            numberOfStudents:
              item.numberOfStudents ?? 0,
            sefRating:
              item.sefRating ?? 0,
          }));
        this.openPrintWindow(normalizedData);
      });
  }
  private openPrintWindow(
    data: FacultyEvaluationPrintRecord[]
  ): void {
    if (!data.length) {
      return;
    }
    const printWindow = window.open(
      '',
      '_blank',
      'width=1200,height=900'
    );
    if (!printWindow) {
      return;
    }
    const rows = data
      .map((item, index) => {
        const students =
          item.numberOfStudents ?? 0;
        const weightedScore =
          students * item.overallAverageScore;
        return `
        <tr>
          <td>${index + 1}</td>
          <td>${item.subjectCode ?? '-'}</td>
          <td>${item.yearLevel ?? '-'}</td>
          <td>${students}</td>
          <td>${item.overallAverageScore.toFixed(2)}</td>
          <td>${weightedScore.toFixed(2)}</td>
        </tr>
      `;
      })
      .join('');
    const comments = data
      .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.commentsOrFeedbacks || '-'}</td>
      </tr>
    `)
      .join('');
    const totalStudents = data.reduce(
      (total, item) =>
        total + (item.numberOfStudents ?? 0),
      0
    );
    const totalWeightedScore = data.reduce(
      (total, item) => {
        const students =
          item.numberOfStudents ?? 0;
        return total +
          students * item.overallAverageScore;
      },
      0
    );
    const setRating =
      totalStudents > 0
        ? totalWeightedScore / totalStudents
        : 0;
    const faculty = data[0];
    printWindow.document.write(`
    <html>
      <head>
        <title>
          Faculty Evaluation Report
        </title>
        <style>
          * {
            box-sizing: border-box;
            font-family: Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 30px;
            background: white;
            color: black;
          }
          .report-header {
            text-align: center;
            margin-bottom: 24px;
          }
          .report-header h1 {
            margin: 0;
            font-size: 24px;
          }
          .report-header p {
            margin-top: 6px;
            font-size: 14px;
          }
          .faculty-info {
            border: 1px solid #ccc;
            padding: 14px;
            margin-bottom: 20px;
          }
          .faculty-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th,
          td {
            border: 1px solid #999;
            padding: 10px;
            font-size: 13px;
          }
          th {
            background: #f3f3f3;
          }
          .section-title {
            margin-top: 30px;
            font-size: 16px;
            font-weight: 700;
          }
          .signature-section {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .signature-box {
            flex: 1;
          }
          .signature-line {
            margin-top: 60px;
            border-top: 1px solid black;
            padding-top: 8px;
            text-align: center;
          }
          @page {
            size: A4 portrait;
            margin: 18mm;
          }
        </style>
      </head>
      <body>
        <!-- HEADER -->
        <div class="report-header">
          <h1>
            CHMSU Faculty Evaluation System
          </h1>
          <p>
            Individual Faculty Evaluation Report
          </p>
        </div>
        <!-- FACULTY INFO -->
        <div class="faculty-info">
          <div class="faculty-grid">
            <div>
              <strong>
                Name of Faculty Evaluated:
              </strong>
              ${faculty?.facultyName ?? '-'}
            </div>
            <div>
              <strong>
                Department/College:
              </strong>
              ${faculty?.college ?? '-'}
            </div>
            <div>
              <strong>
                Current Faculty Rank:
              </strong>
              ${faculty?.position ?? '-'}
            </div>
            <div>
              <strong>
                Semester/Term & Academic Year:
              </strong>
              ${faculty?.semester
        ? `${faculty.semester} Semester`
        : '-'
      }
              /
              ${faculty?.schoolYear
        ? `${faculty.schoolYear} - ${faculty.schoolYear + 1}`
        : '-'
      }
            </div>
          </div>
        </div>
        <!-- SCORES TABLE -->
        <table>
          <thead>
            <tr>
              <th rowspan="2">
                Seq
              </th>
              <th>(1)</th>
              <th>(2)</th>
              <th>(3)</th>
              <th>(4)</th>
              <th>(3 × 4)</th>
            </tr>
            <tr>
              <th>
                Course Code
              </th>
              <th>
                Year/Section
              </th>
              <th>
                No. of Students
              </th>
              <th>
                Average SET Rating
              </th>
              <th>
                Weighted SET Score
              </th>
            </tr>
          </thead>
          <tbody>
            ${rows}
            <tr>
              <td colspan="3">
                <strong>
                  TOTAL
                </strong>
              </td>
              <td>
                <strong>
                  ${totalStudents}
                </strong>
              </td>
              <td></td>
              <td>
                <strong>
                  ${totalWeightedScore.toFixed(2)}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
        <!-- OVERALL -->
        <table style="margin-top: 30px;">
          <thead>
            <tr>
              <th>
                OVERALL RATING
              </th>
              <th>
                SET Rating
              </th>
              <th>
                SEF Rating
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td>
                ${setRating.toFixed(2)}
              </td>
              <td>
                ${faculty?.sefRating?.toFixed(2) ?? 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
        <!-- COMMENTS -->
        <div class="section-title">
          Summary of Qualitative
          Comments and Suggestions
        </div>
        <table>
          <thead>
            <tr>
              <th width="80">
                Seq
              </th>
              <th>
                Comments and Suggestions from Students
              </th>
            </tr>
          </thead>
          <tbody>
            ${comments}
          </tbody>
        </table>
        <!-- SIGNATURES -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">
              Signature of Staff
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              Signature of Authorized Official
            </div>
          </div>
        </div>
      </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
