export enum FacultyEvaluationReportStatus {
  VALID = 'VALID',
  SUPERSEDED = 'SUPERSEDED',
  REVOKED = 'REVOKED',
}

export enum RatingScaleScore {
  ALWAYS_MANIFESTED = 5,
  OFTEN_MANIFESTED = 4,
  SOMETIMES_MANIFESTED = 3,
  SELDOM_MANIFESTED = 2,
  NEVER_OR_RARELY_MANIFESTED = 1,
}

export const RATING_SCALE_METADATA = {
  [RatingScaleScore.ALWAYS_MANIFESTED]: {
    score: 5,
    code: 'AM',
    displayName: 'Always Manifested',
    description: 'The faculty consistently demonstrates this behavior/quality',
    interpretation: 'Excellent',
  },
  [RatingScaleScore.OFTEN_MANIFESTED]: {
    score: 4,
    code: 'OM',
    displayName: 'Often Manifested',
    description: 'The faculty frequently demonstrates this behavior/quality',
    interpretation: 'Very Good',
  },
  [RatingScaleScore.SOMETIMES_MANIFESTED]: {
    score: 3,
    code: 'SM',
    displayName: 'Sometimes Manifested',
    description: 'The faculty occasionally demonstrates this behavior/quality',
    interpretation: 'Good',
  },
  [RatingScaleScore.SELDOM_MANIFESTED]: {
    score: 2,
    code: 'SLM',
    displayName: 'Seldom Manifested',
    description: 'The faculty rarely demonstrates this behavior/quality',
    interpretation: 'Fair',
  },
  [RatingScaleScore.NEVER_OR_RARELY_MANIFESTED]: {
    score: 1,
    code: 'NRM',
    displayName: 'Never or Rarely Manifested',
    description: 'The faculty never or almost never demonstrates this behavior/quality',
    interpretation: 'Poor',
  },
} as const;

export type Semester = '1st' | '2nd' | 'summer';

export type Role =
  | 'FACULTY'
  | 'PROGRAM_CHAIR'
  | 'DEAN'
  | 'STUDENT'
  | 'ADMIN'
  | 'HR';

export type AuthenticatedRole =
  | 'ROLE_STUDENT'
  | 'ROLE_DEAN'
  | 'ROLE_PROGRAM_CHAIR'
  | 'ROLE_ADMIN'
  | 'ROLE_HR';

export enum PrintScoreFormat {
  LIKERT = 'likert',
  PERCENTAGE = 'percentage',
}


