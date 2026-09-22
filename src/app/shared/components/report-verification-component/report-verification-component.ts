import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  AdminService,
  FacultyEvaluationReportVerificationResponse,
} from '@core/services/admin/admin-service';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { catchError, finalize, of, take } from 'rxjs';

@Component({
  selector: 'app-report-verification-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-verification-component.html',
  styleUrl: './report-verification-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportVerificationComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  reportId = '';
  isLoading = true;
  errorMessage = '';
  verification: FacultyEvaluationReportVerificationResponse | null = null;

  ngOnInit(): void {
    this.reportId = this.route.snapshot.paramMap.get('reportId') ?? '';

    if (!this.reportId.trim()) {
      this.isLoading = false;
      this.errorMessage = 'No report ID was provided.';
      return;
    }

    this.adminService
      .verifyFacultyEvaluationReport(this.reportId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        take(1),
        catchError((error) => {
          this.errorMessage = extractErrorMessage(error) || 'Unable to verify this report.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe((response) => {
        this.verification = response;
      });
  }

  get isValid(): boolean {
    const status = this.verification?.status?.toUpperCase();

    return this.verification?.valid === true || status === 'VALID';
  }

  get statusLabel(): string {
    return this.verification?.status || (this.isValid ? 'VALID' : 'UNVERIFIED');
  }
}
