export interface EvidenceCriterion {
  name: string;
  category: string;
  label: string;
  ratingKey: string;
}

export interface FacultyEvidence {
  evidenceId: number;
  facultyId: string;
  classCode?: string;
  subjectCode?: string;
  yearLevel?: string;
  semester?: string;
  schoolYear?: number;
  criterion: string;
  criterionCategory: string;
  criterionLabel: string;
  description?: string;
  uploadedBy: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
