import { createReducer, on } from "@ngrx/store";
import { initialSchoolYearAndSemesterState } from "./school-year-and-semester.state";
import * as SchoolYearAndSemesterActions from './school-year-and-semester.actions';
export const schoolYearAndSemesterReducer =
    createReducer(

        initialSchoolYearAndSemesterState,

        on(
            SchoolYearAndSemesterActions
                .updateSchoolYearAndSemester,

            (state) => ({

                ...state,

                loading: true,

                error: null,
            }),
        ),

        on(
            SchoolYearAndSemesterActions
                .updateSchoolYearAndSemesterSuccess,

            (state, { response }) => ({

                ...state,

                response,

                loading: false,

                error: null,
            }),
        ),

        on(
            SchoolYearAndSemesterActions
                .updateSchoolYearAndSemesterFailure,

            (state, { error }) => ({

                ...state,

                loading: false,

                error,
            }),
        ),

        on(
            SchoolYearAndSemesterActions
                .resetSchoolYearAndSemesterState,

            () => ({
                ...initialSchoolYearAndSemesterState,
            }),
        ),
        on(
            SchoolYearAndSemesterActions
                .fetchCurrentSchoolYearAndSemester,

            (state) => ({

                ...state,

                loading: true,

                error: null,
            }),
        ),
        on(
            SchoolYearAndSemesterActions
                .fetchCurrentSchoolYearAndSemesterSuccess,

            (state, { response }) => ({

                ...state,

                response,

                loading: false,

                error: null,
            }),
        ),
        on(
            SchoolYearAndSemesterActions
                .fetchCurrentSchoolYearAndSemesterFailure,

            (state, { error }) => ({

                ...state,

                loading: false,

                error,
            }),
        ),
    );