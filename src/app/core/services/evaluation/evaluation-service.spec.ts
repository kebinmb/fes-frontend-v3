import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import {
  DEFAULT_EVALUATION_TEMPLATE,
  EvaluationService,
  getEvaluationTemplateForRole,
  SUPERVISOR_CRITERIA_LABELS,
} from './evaluation-service';

describe('EvaluationService', () => {
  let service: EvaluationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEvaluationTemplateForRole', () => {
    it('should return DEFAULT_EVALUATION_TEMPLATE for ROLE_STUDENT', () => {
      const template = getEvaluationTemplateForRole('ROLE_STUDENT');
      expect(template).toEqual(DEFAULT_EVALUATION_TEMPLATE);
      const punctuality = template.categories[0].criteria.find(
        (c) => c.name === 'punctuality',
      );
      expect(punctuality?.label).toBe('Comes to class on time');
    });

    it('should return DEFAULT_EVALUATION_TEMPLATE when role is null or undefined', () => {
      expect(getEvaluationTemplateForRole(null)).toEqual(
        DEFAULT_EVALUATION_TEMPLATE,
      );
      expect(getEvaluationTemplateForRole(undefined)).toEqual(
        DEFAULT_EVALUATION_TEMPLATE,
      );
    });

    it('should return supervisor labels for ROLE_DEAN while preserving criterion names and ids', () => {
      const template = getEvaluationTemplateForRole('ROLE_DEAN');

      const punctuality = template.categories[0].criteria.find(
        (c) => c.name === 'punctuality',
      );
      expect(punctuality?.label).toBe(SUPERVISOR_CRITERIA_LABELS['punctuality']);
      expect(punctuality?.name).toBe('punctuality');
      expect(punctuality?.id).toBe(1);

      const subjectKnowledge = template.categories[1].criteria.find(
        (c) => c.name === 'subjectKnowledge',
      );
      expect(subjectKnowledge?.label).toBe(
        SUPERVISOR_CRITERIA_LABELS['subjectKnowledge'],
      );
      expect(subjectKnowledge?.name).toBe('subjectKnowledge');
    });

    it('should return supervisor labels for ROLE_PROGRAM_CHAIR', () => {
      const template = getEvaluationTemplateForRole('ROLE_PROGRAM_CHAIR');
      const punctuality = template.categories[0].criteria.find(
        (c) => c.name === 'punctuality',
      );
      expect(punctuality?.label).toBe(SUPERVISOR_CRITERIA_LABELS['punctuality']);
    });

    it('should delegate through service.getTemplateForRole', () => {
      const template = service.getTemplateForRole('ROLE_DEAN');
      const punctuality = template.categories[0].criteria.find(
        (c) => c.name === 'punctuality',
      );
      expect(punctuality?.label).toBe(SUPERVISOR_CRITERIA_LABELS['punctuality']);
    });
  });
});
