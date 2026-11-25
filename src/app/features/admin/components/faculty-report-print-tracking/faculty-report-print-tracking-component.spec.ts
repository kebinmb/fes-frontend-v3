import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AdminService } from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';

import { FacultyReportPrintTrackingComponent } from './faculty-report-print-tracking-component';

describe('FacultyReportPrintTrackingComponent', () => {
  let component: FacultyReportPrintTrackingComponent;
  let fixture: ComponentFixture<FacultyReportPrintTrackingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyReportPrintTrackingComponent],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getFacultyEvaluationReportPrintTracking: vi.fn(() =>
              of({
                content: [],
                totalElements: 0,
                totalPages: 0,
                page: 0,
                size: 10,
              }),
            ),
            fetchCurrentSchoolYearAndSemester: vi.fn(() =>
              of({
                id: 1,
                schoolYear: 2024,
                semester: 'FIRST_SEMESTER',
                status: 'ACTIVE',
                createdAt: '2024-01-01',
              }),
            ),
          },
        },
        {
          provide: ToastFacade,
          useValue: {
            showToast: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FacultyReportPrintTrackingComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to active school year and semester', () => {
    expect(component.selectedSchoolYear()).toBe(2024);
    expect(component.selectedSemester()).toBe('1st');
  });

  it('should update filters and clear back to active school year and semester', () => {
    component.updateSchoolYear(2023);
    component.updateSemester('2nd');
    expect(component.selectedSchoolYear()).toBe(2023);
    expect(component.selectedSemester()).toBe('2nd');
    expect(component.hasActiveFilters()).toBe(true);

    component.clearFilters();
    expect(component.selectedSchoolYear()).toBe(2024);
    expect(component.selectedSemester()).toBe('1st');
    expect(component.hasActiveFilters()).toBe(false);
  });
});
