import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEvaluationsDataTableComponent } from './student-evaluations-data-table-component';

describe('StudentEvaluationsDataTable', () => {
  let component: StudentEvaluationsDataTableComponent;
  let fixture: ComponentFixture<StudentEvaluationsDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEvaluationsDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEvaluationsDataTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
