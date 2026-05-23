import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, map, of, switchMap } from 'rxjs';
import { EvaluationService } from '../../services/evaluation/evaluation-service';
import { loadStudentEvaluations, loadStudentEvaluationsSuccess, loadStudentEvaluationsFailure } from './student-evaluation-data.action';
import { AdminService } from '../../services/admin/admin-service';


@Injectable()
export class StudentEvaluationEffects {
    private actions$ = inject(Actions);

    private adminService = inject(AdminService);

    loadStudentEvaluations$ = createEffect(() =>
        this.actions$.pipe(
            ofType(loadStudentEvaluations),

            switchMap((action) =>
                this.
                    adminService.getStudentEvaluations(
                        action.page ?? 0,
                        action.size ?? 10,
                        action.search ?? '',
                        action.sortBy ?? 'createdAt',
                        action.sortDirection ?? 'desc',
                    )
                    .pipe(
                        map((response) =>
                            loadStudentEvaluationsSuccess({
                                response,
                            }),
                        ),

                        catchError((error) =>
                            of(
                                loadStudentEvaluationsFailure({
                                    error:
                                        error?.error?.message ??
                                        'Failed to load student evaluations',
                                }),
                            ),
                        ),
                    ),
            ),
        ),
    );
}