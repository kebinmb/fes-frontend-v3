import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as ToastActions from './toast.actions';
import { delay, map } from "rxjs";
@Injectable({
    providedIn: 'root'
})
export class ToastEffect {
    private action$ = inject(Actions);

    autoClose$ = createEffect(() =>
        this.action$.pipe(
            ofType(ToastActions.showToast),
            delay(3000),
            map(({ id }) => ToastActions.removeToast({ id }))
        )
    );
}