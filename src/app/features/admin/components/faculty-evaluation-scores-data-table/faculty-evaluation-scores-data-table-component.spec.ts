import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AdminService } from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';

import { FacultyEvaluationScoresDataTableComponent } from './faculty-evaluation-scores-data-table-component';

describe('FacultyEvaluationScoresDataTableComponent', () => {
  let component: FacultyEvaluationScoresDataTableComponent;
  let fixture: ComponentFixture<FacultyEvaluationScoresDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyEvaluationScoresDataTableComponent],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getFacultyEvaluationReadiness: vi.fn(() =>
              of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                page: 0,
                size: 10,
              }),
            ),
            generateFacultyEvaluationReport: vi.fn(),
            generateBulkFacultyEvaluationReadinessReports: vi.fn(),
          },
        },
        {
          provide: ToastFacade,
          useValue: {
            showToast: vi.fn(),
          },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyEvaluationScoresDataTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
