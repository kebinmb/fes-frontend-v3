import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface EvaluationClass {
  facultyId: string;
  classCode: string;
  subjectCode: string;
  semester: string;
  schoolYear: number;
  facultyName: string;
  subjectDescription?: string;
  college: string;
  yearLevel: string;
}
export interface SubjectEvaluationDTO {
  facultyId: string;
  evaluatorId: string;
  classCode: string;
  subjectCode: string;
  semester: string;
  yearLevel: string;
  schoolYear: number;
  accessCode: string;
  ratings: Record<string, string>;
  commentsOrFeedbacks?: string;
}
export interface EvaluationResponse {
  success: boolean;
  message: string;
  evaluationId?: number;
  overallScore?: number;
  interpretation?: string;
  breakdown?: string;
  passed?: boolean;
  submittedAt?: string;
  error?: string;
}
export interface SubjectEvaluationSummary {
  facultyId: string;
  subjectCode: string;
  semester: string;
  schoolYear: number;

  totalEvaluations: number;
  averageScore: number;
  overallInterpretation: string;

  categoryAverages: {
    categoryId: number;
    categoryName: string;
    averageScore: number;
  }[];

  passRate: number;
  ratingDistribution: Record<string, number>;
}

export interface FacultyEvaluationScore {
  facultyEvaluationScoreId: number;
  evaluatorId: string;
  facultyName: string;
  facultyId: string;
  yearLevel: string;
  numberOfStudents: number;
  sefRating: number;
  subjectCode: string;
  college: string;
  position: string;
  classCode: string;
  semester: string;
  schoolYear: number;
  overallAverageScore: number;
  overallInterpretation: string;
  scoreBreakdown: string;
  passed: boolean;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  setRating: number;
  evaluatorType: string;
  studentComments:string;
  supervisorComments:string;
}
export interface EvaluationCriteria {
  id: number;
  name: string;
  label: string;
  categoryId: number;
}

export interface EvaluationCategory {
  id: number;
  name: string;
  description: string;
  criteria: EvaluationCriteria[];
}

export interface EvaluationTemplate {
  categories: EvaluationCategory[];
  ratingOptions: RatingOption[];
}

export interface RatingOption {
  value: string;
  label: string;
  score: number;
  description: string;
}
export const DEFAULT_RATING_OPTIONS: RatingOption[] = [
  {
    value: 'ALWAYS_MANIFESTED',
    label: 'Always Manifested',
    score: 5,
    description: 'Consistently demonstrates excellence',
  },
  {
    value: 'OFTEN_MANIFESTED',
    label: 'Often Manifested',
    score: 4,
    description: 'Frequently demonstrates competence',
  },
  {
    value: 'SOMETIMES_MANIFESTED',
    label: 'Sometimes Manifested',
    score: 3,
    description: 'Occasionally demonstrates ability',
  },
  {
    value: 'SELDOM_MANIFESTED',
    label: 'Seldom Manifested',
    score: 2,
    description: 'Seldom demonstrates ability',
  },
  {
    value: 'NEVER_OR_RARELY_MANIFESTED',
    label: 'Never or Rarely Manifested',
    score: 1,
    description: 'Does not demonstrate ability',
  },
];

export const DEFAULT_EVALUATION_TEMPLATE: EvaluationTemplate = {
  categories: [
    {
      id: 1,
      name: 'Management of Teaching and Learning',
      description:
        'Management of Teaching and Learning refers to the intentional and organized handling of classroom presence, clear communication of academic expectations, efficient use of time, and the purposeful use of student-centered activities that promote crtical thinking, independent learning, reflection, decision-making, and continuous academic improvement through constructive feedback.',
      criteria: [
        { id: 1, name: 'punctuality', label: 'Comes to class on time', categoryId: 1 },
        {
          id: 2,
          name: 'courseClarity',
          label:
            'Explains learning outcomes, expectations, grading system, and various requriements of the subject/course.',
          categoryId: 1,
        },
        {
          id: 3,
          name: 'timeManagement',
          label: 'Maximizes the allocated time/learning hours effectively.',
          categoryId: 1,
        },
        {
          id: 4,
          name: 'criticalThinkingFacilitation',
          label:
            'Facilititates students to think critically and creatively by providing appropriate learning activities.',
          categoryId: 1,
        },
        {
          id: 5,
          name: 'independentLearningGuidance',
          label:
            'Guides students to learn on their own, reflect on new ideas and experiences, and make decisions in accomplishing given tasks.',
          categoryId: 1,
        },
        {
          id: 6,
          name: 'feedbackCommunication',
          label: 'Communicates constructive feedback to students for their academic growth.',
          categoryId: 1,
        },
      ],
    },
    {
      id: 2,
      name: 'Content Knowledge, Pedagogy and Technology',
      description:
        "Content Knowledge, Pedagogy and Technology refer to a teacher's ability to demonstrate a storng grasp of subject matter, present complex concepts in a clear and accessible way, relate content to real-world contexts and current developments, engage students through appropriate instructional strategies and digital tools, and apply assessment methods aligned with intended learning outcomes.",
      criteria: [
        {
          id: 7,
          name: 'subjectKnowledge',
          label: 'Demonstrates extensive and broad knowledge of the subject/course.',
          categoryId: 2,
        },
        {
          id: 8,
          name: 'contentSimplification',
          label: 'Simplifies complex ideas in the lesson for ease of understanding.',
          categoryId: 2,
        },
        {
          id: 9,
          name: 'realWorldApplication',
          label:
            'Relates the subject matter to contemporary issues and developments in the discipline and/or daily life activities.',
          categoryId: 2,
        },
        {
          id: 10,
          name: 'technologyIntegration',
          label:
            'Promotes active learning and student engagement by using appropriate teaching and learning resources including ICT tools and platforms.',
          categoryId: 2,
        },
        {
          id: 11,
          name: 'assessmentAlignment',
          label:
            'Uses appropriate assessments (projects, exams, quizzes, assignments, etc.) aligned with the learning outcomes.',
          categoryId: 2,
        },
      ],
    },
    {
      id: 3,
      name: 'Commitment and Transparency',
      description:
        "Commitment and Transparency refer to the teacher's consistent dedication to supporting student learning by acknowledging learner diversity, offering timely academic support and feedback, and upholding fairness and accountability through the use of clear and openly communicated performance criteria.",
      criteria: [
        {
          id: 12,
          name: 'diversityRecognition',
          label:
            'Recognizes and values the unique diversity and individual differences among students.',
          categoryId: 3,
        },
        {
          id: 13,
          name: 'consultationSupport',
          label: 'Assists students with their learning challenges during consultation hours.',
          categoryId: 3,
        },
        {
          id: 14,
          name: 'immediateFeedback',
          label: 'Provides immediate feedback on student outputs and performance.',
          categoryId: 3,
        },
        {
          id: 15,
          name: 'transparentGrading',
          label: "Provides transparent and clear criteria in rating student's performance.",
          categoryId: 3,
        },
      ],
    },
  ],
  ratingOptions: DEFAULT_RATING_OPTIONS,
};
export interface EvaluationCheckResponse {
  hasEvaluated: boolean;
  message: string;
}
@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private readonly EVALUATION_BASE_URL = `${environment.API_URL}/evaluation`;
  private readonly FACULTY_BASE_URL = `${environment.API_URL}/faculty`;
  private readonly STUDENT_BASE_URL = `${environment.API_URL}/student`;
  private http = inject(HttpClient);
  submitEvaluation(role: string, dto: SubjectEvaluationDTO): Observable<EvaluationResponse> {
    const payload = {
      ...dto,
      evaluationType: role, // 🔥 VERY IMPORTANT
    };

    return this.http.post<EvaluationResponse>(`${this.EVALUATION_BASE_URL}/submit`, payload, {
      withCredentials: true,
    });
  }

  checkEvaluationStatus(
    role: string, // ✅ add this
    facultyId: string,
    evaluatorId: string,
    classCode: string,
    subjectCode: string,
    yearLevel: string,
    semester: string,
    schoolYear: number,
  ): Observable<EvaluationCheckResponse> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('evaluatorId', evaluatorId)
      .set('classCode', classCode)
      .set('subjectCode', subjectCode)
      .set('yearLevel', yearLevel)
      .set('semester', semester)
      .set('schoolYear', schoolYear.toString());

    const url =
      role === 'ROLE_STUDENT' ? `${this.STUDENT_BASE_URL}/check` : `${this.FACULTY_BASE_URL}/check`;

    return this.http.get<EvaluationCheckResponse>(url, { params, withCredentials: true });
  }

  getSubjectSummary(
    facultyId: string,
    subjectCode: string,
    semester: string,
    schoolYear: number,
  ): Observable<SubjectEvaluationSummary> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('subjectCode', subjectCode)
      .set('semester', semester)
      .set('schoolYear', schoolYear.toString());

    return this.http.get<SubjectEvaluationSummary>(`${this.STUDENT_BASE_URL}/summary`, {
      params,
      withCredentials: true,
    });
  }

  getEvaluations(
    facultyId: string,
    subjectCode: string,
    semester: string,
    schoolYear: number,
  ): Observable<FacultyEvaluationScore[]> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('subjectCode', subjectCode)
      .set('semester', semester)
      .set('schoolYear', schoolYear.toString());

    return this.http.get<FacultyEvaluationScore[]>(`${this.STUDENT_BASE_URL}/list`, {
      params,
      withCredentials: true,
    });
  }

  getRatingDistribution(
    facultyId: string,
    semester: string,
    schoolYear: number,
  ): Observable<Record<string, number>> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('semester', semester)
      .set('schoolYear', schoolYear.toString());

    return this.http.get<Record<string, number>>(`${this.STUDENT_BASE_URL}/distribution`, {
      params,
      withCredentials: true,
    });
  }
}
