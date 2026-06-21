import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyDataTableComponent } from './faculty-data-table-component';

describe('FacultyDataTableComponent', () => {
  let component: FacultyDataTableComponent;
  let fixture: ComponentFixture<FacultyDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyDataTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
