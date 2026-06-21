import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyEvaluationScoresDataTableComponent } from './faculty-evaluation-scores-data-table-component';

describe('FacultyEvaluationScoresDataTableComponent', () => {
  let component: FacultyEvaluationScoresDataTableComponent;
  let fixture: ComponentFixture<FacultyEvaluationScoresDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyEvaluationScoresDataTableComponent]
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
