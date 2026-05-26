import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyEvaluationModalComponent } from './faculty-evaluation-modal-component';

describe('FacultyEvaluationModalComponent', () => {
  let component: FacultyEvaluationModalComponent;
  let fixture: ComponentFixture<FacultyEvaluationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyEvaluationModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyEvaluationModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
