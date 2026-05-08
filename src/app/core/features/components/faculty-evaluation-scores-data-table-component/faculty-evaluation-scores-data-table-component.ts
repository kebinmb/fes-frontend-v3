import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';
import { Actions, ofType } from '@ngrx/effects';
import * as AdminDataActions from './../../../store/admin-data/admin-data.actions';
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
  selector: 'app-faculty-evaluation-scores-data-table-component',
  standalone: true,
  imports: [DecimalPipe, AsyncPipe],
  templateUrl: './faculty-evaluation-scores-data-table-component.html',
  styleUrl: './faculty-evaluation-scores-data-table-component.css',
})
export class FacultyEvaluationScoresDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  private actions$ = inject(Actions);
  facultyEvaluationScore$ = this.adminDataFacade.facultyEvaluationScores$;
  facultyEvaluationScoresByFacultyId$ = this.adminDataFacade.facultyEvaluationScoresByFacultyId$;
  ngOnInit(): void {
    this.adminDataFacade.loadFacultyEvaluationScores(0, 10);
  }
  onUserPageChange(page: number): void {
    if (page < 0) {
      return;
    }

    this.adminDataFacade.loadFacultyEvaluationScores(page, 10);
  }
  printSingle(record: FacultyEvaluationPrintRecord): void {

  this.adminDataFacade.loadFacultyEvaluationScoresByFacultyId(
    record.facultyId
  );

  this.actions$
    .pipe(
      ofType(AdminDataActions.loadFacultyEvaluationScoresByFacultyIdSuccess),
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
  printBulk(data: FacultyEvaluationPrintRecord[]): void {
    this.openPrintWindow(data);
  }
  private openPrintWindow(data: FacultyEvaluationPrintRecord[]): void {
    if (!data.length) {
      return;
    }
    const printWindow = window.open('', '_blank', 'width=1200,height=900');
    if (!printWindow) {
      return;
    }
    const rows = data
      .map((item, index) => {
        const students = item.numberOfStudents ?? 0;
        const weightedScore = students * item.overallAverageScore;
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
              ${item.overallAverageScore.toFixed(2)}
            </td>

            <td>
              ${weightedScore.toFixed(2)}
            </td>
          </tr>
        `;
      })
      .join('');
    const comments = data
      .map((item, index) => {
        return `
          <tr>
            <td>${index + 1}</td>

            <td>
              ${item.commentsOrFeedbacks || '-'}
            </td>
          </tr>
        `;
      })
      .join('');

    const totalStudents = data.reduce((total, item) => {
      return total + (item.numberOfStudents ?? 0);
    }, 0);

    const totalWeightedScore = data.reduce((total, item) => {
      const students = item.numberOfStudents ?? 0;

      return total + students * item.overallAverageScore;
    }, 0);

    const setRating = totalStudents > 0 ? totalWeightedScore / totalStudents : 0;

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
              grid-template-columns:
                repeat(2, 1fr);
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
                ${data[0]?.facultyName ?? '-'}
              </div>

              <div>
                <strong>
                  Department/College:
                </strong>

                ${data[0]?.college ?? '-'}
              </div>
              <div>
                <strong>
                  Current Faculty Rank:
                </strong>

                ${data[0]?.position ?? '-'}
              </div>

             <div>
  <strong>
    Semester/Term & Academic Year:
  </strong>
  ${data[0]?.semester ? `${data[0].semester} Semester` : '-'}
  /
  ${data[0]?.schoolYear ? `${data[0].schoolYear} - ${data[0].schoolYear + 1}` : '-'}
</div>
            </div>

          </div>

          <!-- SCORES TABLE -->

          <table>

            <thead>

  <!-- COLUMN INDEX -->

  <tr>

    <th rowspan="2">
      Seq
    </th>

    <th>
      (1)
    </th>

    <th>
      (2)
    </th>

    <th>
      (3)
    </th>

    <th>
      (4)
    </th>

    <th>
      (3 × 4)
    </th>

  </tr>

  <!-- COLUMN LABELS -->

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
                  ${data[0]?.sefRating?.toFixed(2) ?? 'N/A'}
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
                  Comments and Suggestions
                  from Students
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
