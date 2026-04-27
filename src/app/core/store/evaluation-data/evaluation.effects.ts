// import { inject, Injectable } from "@angular/core";
// import { Actions, createEffect, ofType } from "@ngrx/effects";
// import { Store } from "@ngrx/store";
// import { EvaluationService } from "../../services/evaluation/evaluation-service";
// import { Router } from "@angular/router";
// import { ToastFacade } from "../toast/toast.facade";
// import { SpinnerFacade } from "../spinner/spinner.facade";
// import * as EvaluationActions from './evaluation.action';
// import { filter, map, withLatestFrom } from "rxjs";
// import { AuthFacade } from "../auth/auth.facade";
// import { StudentDataFacade } from "../student-data/student-data.facade";
// import { selectRole } from "../auth/auth.selector";
// import { selectSelectedClass } from "../student-data/student-data.selectors";
// @Injectable()
// export class EvaluationEffects {
//     private actions$ = inject(Actions);
//     private store = inject(Store);
//     private evaluationService = inject(EvaluationService);
//     private router = inject(Router);
//     private toastFacade = inject(ToastFacade);
//     private spinnerFacade = inject(SpinnerFacade);
//     private authFacade = inject(AuthFacade);
//     private studentDataFacade = inject(StudentDataFacade);
//     init$ = createEffect(() =>
//         this.actions$.pipe(
//             ofType(EvaluationActions.initializeEvaluation),

//             withLatestFrom(
//                 this.store.select(selectRole),
//                 this.store.select(selectSelectedClass),
//                 // this.store.select(selectSupervisorSelectedClass)
//             ),

//             filter(([_, role, studentCls, supervisorCls]) =>
//                 !!role && (!!studentCls || !!supervisorCls)
//             ),

//             map(([_, role, studentCls, supervisorCls]) => {

//                 const cls =
//                     role === 'ROLE_STUDENT'
//                         ? studentCls
//                         : role === 'ROLE_DEAN'
//                             ? supervisorCls
//                             : null;

//                 if (!cls) {
//                     return EvaluationActions.checkEvaluationStatusFailure({
//                         error: 'No class selected',
//                     });
//                 }

//                 return EvaluationActions.setEvaluationContext({
//                     context: {
//                         facultyId: cls.facultyId,
//                         classCode: cls.classCode,
//                         subjectCode: cls.subjectCode,
//                         semester: cls.semester,
//                         schoolYear: cls.schoolYear,
//                         facultyName: cls.facultyName,
//                         subjectDescription: cls.subjectDescription ?? '',
//                         college: cls.college,
//                         yearLevel: cls.yearLevel,
//                     }
//                 });
//             })
//         )
//     );
// }