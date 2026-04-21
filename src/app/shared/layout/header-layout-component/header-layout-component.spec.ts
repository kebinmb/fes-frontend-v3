import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderLayoutComponent } from './header-layout-component';

describe('HeaderLayoutComponent', () => {
  let component: HeaderLayoutComponent;
  let fixture: ComponentFixture<HeaderLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
