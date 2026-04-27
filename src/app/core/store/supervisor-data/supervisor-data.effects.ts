import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { SupervisorDataService } from "../../services/supervisor-data/supervisor-data-service";
import { ToastFacade } from "../toast/toast.facade";
import { SpinnerFacade } from "../spinner/spinner.facade";
import { Store } from "@ngrx/store";
import * as SupervisorDataActions from "./supervisor-data.actions";
import {
    catchError,
    filter,
    map,
    of,
    switchMap,
    tap,
    withLatestFrom,
    finalize
} from "rxjs";
import { EvaluationService } from "../../services/evaluation/evaluation-service";

@Injectable({ providedIn: "root" })
export class SupervisorDataEffects {
    private actions$ = inject(Actions);
    private supervisorDataService = inject(SupervisorDataService);
    private toastFacade = inject(ToastFacade);
    private spinnerFacade = inject(SpinnerFacade);
    private store = inject(Store);
    private evaluationDataService = inject(EvaluationService);
    loadFaculties$ = createEffect(() =>

        this.actions$.pipe(
            ofType(SupervisorDataActions.loadFaculties),

            withLatestFrom(
                this.store.select(state => state.supervisorData.faculties)
            ),

            filter(([{ key }, faculties]) => {
                const cached = faculties[key];
                return !cached || cached.data.length === 0;
            }),
            switchMap(([{ key, college, status }]) => {
                this.spinnerFacade.showSpinner();
                return this.supervisorDataService.getFaculties(college, status).pipe(
                    tap(response => console.log("Faculties:", response)),
                    map(response =>
                        SupervisorDataActions.loadFacultiesSuccess({ key, response })
                    ),
                    catchError(error => {
                        this.toastFacade.showToast("Failed to load faculties", "error");
                        return of(
                            SupervisorDataActions.loadFacultiesFailure({ key, error })
                        );
                    }),

                    finalize(() => this.spinnerFacade.hideSpinner())
                );
            })
        )
    );
    loadFacultyClasses$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SupervisorDataActions.loadFacultyClasses),

            withLatestFrom(
                this.store.select(state => state.supervisorData.facultyClasses)
            ),

            filter(([{ key }, state]) => {
                const cached = state[key];
                return !cached || (!cached.loading && cached.classes.length === 0);
            }),

            switchMap(([{ key, facultyId }]) => {
                this.spinnerFacade.showSpinner();

                return this.supervisorDataService.loadFacultyClasses(facultyId).pipe(
                    map(classes =>
                        SupervisorDataActions.loadFacultyClassesSuccess({
                            key,
                            data: { facultyId, classes }
                        })
                    ),

                    catchError(error => {
                        this.toastFacade.showToast("Failed to load faculty classes", "error");
                        return of(
                            SupervisorDataActions.loadFacultyClassesFailure({
                                key,
                                error: error.message || "Failed to load classes"
                            })
                        );
                    }),

                    finalize(() => this.spinnerFacade.hideSpinner())
                );
            })
        )
    );
    loadEvaluationStatus$ = createEffect(() =>
        this.actions$.pipe(
            ofType(SupervisorDataActions.loadEvaluationStatus),

            withLatestFrom(
                this.store.select(state => state.supervisorData.evaluationStatus)
            ),

            filter(([{ key, context }, state]) => {
                const cached = state[key]?.classes?.[context.classCode];

                return (
                    !cached ||
                    (!cached.loading && cached.evaluated === null)
                );
            }),

            switchMap(([{ key, context, role }]) =>
                this.evaluationDataService
                    .checkEvaluationStatus(
                        role!,
                        context.facultyId,
                        context.evaluatorId,
                        context.classCode,
                        context.semester,
                        context.schoolYear
                    )
                    .pipe(
                        map(res =>
                            SupervisorDataActions.loadEvaluationStatusSuccess({
                                key,
                                classCode: context.classCode,
                                evaluated: res.hasEvaluated
                            })
                        ),
                        catchError(err =>
                            of(
                                SupervisorDataActions.loadEvaluationStatusFailure({
                                    key,
                                    classCode: context.classCode,
                                    error: err.message
                                })
                            )
                        )
                    )
            )
        )
    );
}