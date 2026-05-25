import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyEvaluationPrintComponent } from './faculty-evaluation-print-component';

describe('FacultyEvaluationPrintComponent', () => {
  let component: FacultyEvaluationPrintComponent;
  let fixture: ComponentFixture<FacultyEvaluationPrintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyEvaluationPrintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyEvaluationPrintComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
