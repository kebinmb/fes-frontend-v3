import { TestBed } from '@angular/core/testing';

import { SupervisorDataService } from './supervisor-data-service';

describe('SupervisorDataService', () => {
  let service: SupervisorDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupervisorDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
