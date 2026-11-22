import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';
import { BehaviorSubject, map, of } from 'rxjs';
import { ErrorComponent } from './error-component';
import { AuthState } from '../../core/store/auth/auth.state';

describe('ErrorComponent', () => {
  let component: ErrorComponent;
  let fixture: ComponentFixture<ErrorComponent>;
  let router: Router;
  let location: Location;

  const mockAuthState$ = new BehaviorSubject<{ auth: AuthState }>({
    auth: {
      evaluatorId: 'test-user',
      role: 'ROLE_STUDENT',
      isAuthenticated: true,
      isLoading: false,
      isAuthChecked: true,
      error: null,
      accessCode: null,
      accessCodeSent: false,
      college: null,
    },
  });

  const mockActivatedRoute = {
    snapshot: {
      data: { code: 403 },
      queryParamMap: {
        get: (key: string) => null,
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: mockActivatedRoute,
        },
        {
          provide: Store,
          useValue: {
            select: (selector: any) => {
              return mockAuthState$.pipe(map(selector));
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should correctly resolve error preset for 403 Forbidden', () => {
    expect(component.errorCode()).toBe(403);
    const preset = component.errorPreset();
    expect(preset.badge).toContain('403');
    expect(preset.title).toBe('Access Restricted');
  });

  it('should navigate to the student dashboard when role is ROLE_STUDENT', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    expect(component.dashboardPath()).toBe('/student-dashboard');

    component.onPrimaryAction();
    expect(navigateSpy).toHaveBeenCalledWith(['/student-dashboard']);
  });

  it('should navigate to login on 401 Unauthorized', () => {
    mockActivatedRoute.snapshot.data = { code: 401 } as any;
    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(router, 'navigate');
    expect(component.errorCode()).toBe(401);
    component.onPrimaryAction();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
