import { SchoolYearAndSemesterResponse } from "../../services/admin/admin-service";

export interface SchoolYearAndSemesterState {

  response: SchoolYearAndSemesterResponse | null;

  loading: boolean;

  error: any;
}

export const initialSchoolYearAndSemesterState:
  SchoolYearAndSemesterState = {

  response: null,

  loading: false,

  error: null,
};