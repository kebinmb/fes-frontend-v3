import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluatedStudentsComponent } from './evaluated-students-component';

describe('EvaluatedStudentsComponent', () => {
  let component: EvaluatedStudentsComponent;
  let fixture: ComponentFixture<EvaluatedStudentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluatedStudentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluatedStudentsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
