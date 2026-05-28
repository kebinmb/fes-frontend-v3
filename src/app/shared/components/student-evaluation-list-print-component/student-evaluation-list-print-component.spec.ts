import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEvaluationListPrintComponent } from './student-evaluation-list-print-component';

describe('StudentEvaluationListPrintComponent', () => {
  let component: StudentEvaluationListPrintComponent;
  let fixture: ComponentFixture<StudentEvaluationListPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEvaluationListPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEvaluationListPrintComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
