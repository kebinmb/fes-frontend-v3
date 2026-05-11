import { inject, Injectable } from '@angular/core';

import { Store } from '@ngrx/store';

import * as SchoolYearAndSemesterActions
    from './school-year-and-semester.actions';

import * as SchoolYearAndSemesterSelectors
    from './school-year-and-semester.selectors';
import { Semester } from '../../services/admin/admin-service';



@Injectable({
    providedIn: 'root',
})
export class SchoolYearAndSemesterFacade {

    private store = inject(Store);

    /* =========================================
       SELECTORS
    ========================================= */

    response$ =
        this.store.select(
            SchoolYearAndSemesterSelectors
                .selectSchoolYearAndSemesterResponse,
        );

    loading$ =
        this.store.select(
            SchoolYearAndSemesterSelectors
                .selectSchoolYearAndSemesterLoading,
        );

    error$ =
        this.store.select(
            SchoolYearAndSemesterSelectors
                .selectSchoolYearAndSemesterError,
        );

    /* =========================================
       ACTIONS
    ========================================= */

    updateSchoolYearAndSemester(
        schoolYear: number,
        semester: Semester,
    ): void {

        this.store.dispatch(

            SchoolYearAndSemesterActions
                .updateSchoolYearAndSemester({

                    schoolYear,

                    semester,
                }),
        );
    }

    resetState(): void {

        this.store.dispatch(

            SchoolYearAndSemesterActions
                .resetSchoolYearAndSemesterState(),
        );
    }

    fetchCurrentSchoolYearAndSemester(): void {

        this.store.dispatch(

            SchoolYearAndSemesterActions
                .fetchCurrentSchoolYearAndSemester(),
        );
    }
}