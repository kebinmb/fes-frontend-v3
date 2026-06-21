import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAccountsDataTableComponent } from './user-accounts-data-table-component';

describe('UserAccountsDataTableComponent', () => {
  let component: UserAccountsDataTableComponent;
  let fixture: ComponentFixture<UserAccountsDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAccountsDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAccountsDataTableComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
