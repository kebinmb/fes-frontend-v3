import {
    createFeatureSelector,
    createSelector,
} from '@ngrx/store';
import { SchoolYearAndSemesterState } from './school-year-and-semester.state';



export const
    selectSchoolYearAndSemesterState =
        createFeatureSelector<SchoolYearAndSemesterState>(
            'schoolYearAndSemesterData',
        );

export const
    selectSchoolYearAndSemesterResponse =
        createSelector(
            selectSchoolYearAndSemesterState,
            (state) => state.response,
        );

export const
    selectSchoolYearAndSemesterLoading =
        createSelector(
            selectSchoolYearAndSemesterState,
            (state) => state.loading,
        );

export const
    selectSchoolYearAndSemesterError =
        createSelector(
            selectSchoolYearAndSemesterState,
            (state) => state.error,
        );