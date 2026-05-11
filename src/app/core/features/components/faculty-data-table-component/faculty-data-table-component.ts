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
  evaluatorType?: string;
  classCode: string;
  semester?: string;
  schoolYear?: number;
  subjectCode?: string;
  yearLevel?: string;
  commentsOrFeedbacks?: string;
  overallAverageScore: number;
  overallInterpretation?: string;
  numberOfStudents?: number;
  setRating?: number;
  sefRating?: number;
  studentComments?: string;
  supervisorComments?: string;
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
    console.log("Pressed")
    if (this.facultyForm.invalid) {
      console.log("Faculty Form Invalid")
      this.facultyForm.markAllAsTouched();
      return;
    }
    this.adminDataFacade.updateFaculty(this.facultyForm.value);
    this.closeEditModal();
  }
  get f() {
    return this.facultyForm.controls;
  }
  printSingle(
    record: FacultyEvaluationPrintRecord
  ): void {
    this.adminDataFacade
      .loadFacultyEvaluationScoresByFacultyId(
        record.facultyId
      );
    this.actions$
      .pipe(
        ofType(
          AdminDataActions
            .loadFacultyEvaluationScoresByFacultyIdSuccess
        ),
        take(1)
      )
      .subscribe(({ response }) => {
        const normalizedData:
          FacultyEvaluationPrintRecord[] =
          response.map((item) => ({
            facultyEvaluationScoreId:
              item.facultyEvaluationScoreId,
            facultyId:
              item.facultyId,
            facultyName:
              item.facultyName ??
              record.facultyName,
            evaluatorId:
              item.evaluatorId,
            evaluatorType:
              item.evaluatorType,
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
            setRating:
              item.setRating ?? 0,
            sefRating:
              item.sefRating ?? 0,
            studentComments:
              item.studentComments ?? '-',
            supervisorComments:
              item.supervisorComments ?? '-',
          }));
        this.openPrintWindow(
          normalizedData
        );
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
    const faculty = data[0];
    /* =====================================================
       SET DATA
       ===================================================== */
    const setData = data.filter(
      item => (item.setRating ?? 0) > 0
    );
    /* =====================================================
       SEF DATA
       ===================================================== */
    const sefData = data.filter(
      item => (item.sefRating ?? 0) > 0
    );
    /* =====================================================
       SET ROWS
       ===================================================== */
    const setRows = setData
      .map((item, index) => {
        const students =
          item.numberOfStudents ?? 0;
        const setRating =
          item.setRating ?? 0;
        const weightedScore =
          students * setRating;
        return `
        <tr>
          <td>${index + 1}</td>
          <td>
            ${item.subjectCode ?? '-'}
          </td>
          <td>
            ${item.yearLevel ?? '-'}
          </td>
          <td>
            ${students}
          </td>
          <td>
            ${setRating.toFixed(2)}
          </td>
          <td>
            ${weightedScore.toFixed(2)}
          </td>
        </tr>
      `;
      })
      .join('');
    /* =====================================================
       SEF ROWS
       ===================================================== */
    const sefRows = sefData
      .map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>
          ${item.subjectCode ?? '-'}
        </td>
        <td>
          ${item.yearLevel ?? '-'}
        </td>
        <td>
          ${(item.sefRating ?? 0).toFixed(2)}
        </td>
      </tr>
    `)
      .join('');
    /* =====================================================
       STUDENT COMMENTS
       ===================================================== */
    const studentComments = data
      .filter(item =>
        item.studentComments &&
        item.studentComments !== '-'
      )
      .map((item, index) => `
      <tr>
        <td>
          ${index + 1}
        </td>
        <td>
          ${item.studentComments}
        </td>
      </tr>
    `)
      .join('');
    /* =====================================================
       SUPERVISOR COMMENTS
       ===================================================== */
    const supervisorComments = data
      .filter(item =>
        item.supervisorComments &&
        item.supervisorComments !== '-'
      )
      .map((item, index) => `
      <tr>
        <td>
          ${index + 1}
        </td>
        <td>
          ${item.supervisorComments}
        </td>
      </tr>
    `)
      .join('');
    /* =====================================================
       TOTALS
       ===================================================== */
    const totalStudents = setData.reduce(
      (total, item) =>
        total + (
          item.numberOfStudents ?? 0
        ),
      0
    );
    const totalWeightedScore = setData.reduce(
      (total, item) => {
        const students =
          item.numberOfStudents ?? 0;
        const setRating =
          item.setRating ?? 0;
        return total +
          (students * setRating);
      },
      0
    );
    const overallSetRating =
      totalStudents > 0
        ? totalWeightedScore / totalStudents
        : 0;

    const overallSefRating =
      sefData.length > 0
        ? sefData.reduce(
          (total, item) =>
            total + (item.sefRating ?? 0),
          0
        ) / sefData.length
        : 0;
    /* =====================================================
       PRINT
       ===================================================== */
    printWindow.document.write(`
    <html>
      <head>
        <title>
          Faculty Evaluation Report
        </title>
        <style>
          * {
            box-sizing: border-box;
            font-family:
              Arial,
              sans-serif;
          }
          body {
            margin: 0;
            padding: 32px;
            background: white;
            color: black;
          }
          .report-header {
            text-align: center;
            margin-bottom: 28px;
          }
          .report-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .report-header p {
            margin-top: 6px;
            font-size: 14px;
          }
          .faculty-info {
            border: 1px solid #999;
            padding: 14px;
            margin-bottom: 26px;
          }
          .faculty-grid {
            display: grid;
            grid-template-columns:
              repeat(2, 1fr);
            gap: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 14px;
          }
          th,
          td {
            border: 1px solid #999;
            padding: 10px;
            font-size: 13px;
            vertical-align: top;
          }
          th {
            background: #f3f3f3;
            font-weight: 700;
          }
          .section-title {
            margin-top: 36px;
            margin-bottom: 10px;
            font-size: 16px;
            font-weight: 700;
          }
          /* ===================================================
             APPROVAL SECTION
             =================================================== */
          .approval-section {
            margin-top: 80px;
            display: flex;
            flex-direction: column;
            gap: 42px;
          }
          .approval-group {
            width: 100%;
          }
          .approval-heading {
            margin-bottom: 14px;
            font-size: 15px;
            font-weight: 500;
          }
          .approval-row {
            display: flex;
            align-items: center;
            margin-bottom: 14px;
          }
          .approval-label {
            min-width: 300px;
            font-size: 15px;
            font-weight: 600;
          }
          .approval-colon {
            font-size: 15px;
            font-weight: 600;
          }
          @page {
            size: A4 portrait;
            margin: 18mm;
          }
        </style>
      </head>
      <body>
        <!-- ================================================= -->
        <!-- HEADER -->
        <!-- ================================================= -->
        <div class="report-header">
          <h1>
            CHMSU Faculty Evaluation System
          </h1>
          <p>
            Individual Faculty Evaluation Report
          </p>
        </div>
        <!-- ================================================= -->
        <!-- FACULTY INFO -->
        <!-- ================================================= -->
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
        <!-- ================================================= -->
        <!-- SET -->
        <!-- ================================================= -->
        <div class="section-title">
          A. Student Evaluation of Teaching (SET)
        </div>
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
                SET Rating
              </th>
              <th>
                Weighted SET Score
              </th>
            </tr>
          </thead>
          <tbody>
            ${setRows}
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
        <!-- ================================================= -->
        <!-- SEF -->
        <!-- ================================================= -->
        <div class="section-title">
          B. Supervisor Evaluation of Faculty (SEF)
        </div>
        <table>
          <thead>
            <tr>
              <th>
                Seq
              </th>
              <th>
                Course Code
              </th>
              <th>
                Year/Section
              </th>
              <th>
                SEF Rating
              </th>
            </tr>
          </thead>
          <tbody>
            ${sefRows}
          </tbody>
        </table>
        <!-- ================================================= -->
        <!-- OVERALL -->
        <!-- ================================================= -->
        <div class="section-title">
          C. Overall Evaluation Summary
        </div>
        <table>
          <thead>
            <tr>
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
              <td>
                ${overallSetRating.toFixed(2)}
              </td>
              <td>
                ${overallSefRating.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
        <!-- ================================================= -->
        <!-- STUDENT COMMENTS -->
        <!-- ================================================= -->
        <div class="section-title">
          D. Comments and Suggestions
          from Students
        </div>
        <table>
          <thead>
            <tr>
              <th width="80">
                Seq
              </th>
              <th>
                Student Comments
              </th>
            </tr>
          </thead>
          <tbody>
            ${studentComments}
          </tbody>
        </table>
        <!-- ================================================= -->
        <!-- SUPERVISOR COMMENTS -->
        <!-- ================================================= -->
        <div class="section-title">
          E. Comments and Suggestions
          from Supervisor
        </div>
        <table>
          <thead>
            <tr>
              <th width="80">
                Seq
              </th>
              <th>
                Supervisor Comments
              </th>
            </tr>
          </thead>
          <tbody>
            ${supervisorComments}
          </tbody>
        </table>
        <!-- ================================================= -->
        <!-- APPROVALS -->
        <!-- ================================================= -->
        <div class="approval-section">
          <!-- PREPARED -->
          <div class="approval-group">
            <div class="approval-heading">
              Prepared by:
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Signature of Staff
              </span>
              <span class="approval-colon">
                :
              </span>
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Name of Staff
              </span>
              <span class="approval-colon">
                :
              </span>
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Date
              </span>
              <span class="approval-colon">
                :
              </span>
            </div>
          </div>
          <!-- REVIEWED -->
          <div class="approval-group">
            <div class="approval-heading">
              Reviewed by:
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Signature of Authorized Official
              </span>
              <span class="approval-colon">
                :
              </span>
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Name of Authorized Official
              </span>
              <span class="approval-colon">
                :
              </span>
            </div>
            <div class="approval-row">
              <span class="approval-label">
                Date
              </span>
              <span class="approval-colon">
                :
              </span>
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
