import { createAction, props } from '@ngrx/store';
import { Semester, SchoolYearAndSemesterResponse } from '../../services/admin/admin-service';


export const updateSchoolYearAndSemester = createAction(
    '[School Year And Semester] Update',
    props<{
        schoolYear: number;
        semester: Semester;
    }>(),
);

export const updateSchoolYearAndSemesterSuccess = createAction(
    '[School Year And Semester] Update Success',
    props<{
        response: SchoolYearAndSemesterResponse;
    }>(),
);

export const updateSchoolYearAndSemesterFailure = createAction(
    '[School Year And Semester] Update Failure',
    props<{
        error: any;
    }>(),
);

export const resetSchoolYearAndSemesterState = createAction(
    '[School Year And Semester] Reset State',
);

export const fetchCurrentSchoolYearAndSemester =
  createAction(
    '[School Year And Semester] Fetch Current',
  );

export const
fetchCurrentSchoolYearAndSemesterSuccess =
  createAction(
    '[School Year And Semester] Fetch Current Success',

    props<{
      response: SchoolYearAndSemesterResponse;
    }>(),
  );

export const
fetchCurrentSchoolYearAndSemesterFailure =
  createAction(
    '[School Year And Semester] Fetch Current Failure',

    props<{
      error: any;
    }>(),
  );