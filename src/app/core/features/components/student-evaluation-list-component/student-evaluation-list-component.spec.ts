import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentEvaluationListComponent } from './student-evaluation-list-component';

describe('StudentEvaluationListComponent', () => {
  let component: StudentEvaluationListComponent;
  let fixture: ComponentFixture<StudentEvaluationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentEvaluationListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentEvaluationListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
