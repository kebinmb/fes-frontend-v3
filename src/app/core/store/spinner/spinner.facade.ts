import { inject, Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { selectLoading } from "./spinner.selector";
import { debounceTime } from "rxjs";
import * as SpinnerActions from "./spinner.action";
@Injectable({
    providedIn: 'root'
})
export class SpinnerFacade {
    private store = inject(Store);

    loading$ = this.store.select(selectLoading).pipe(
        debounceTime(1000)
    );

    showSpinner() {
        this.store.dispatch(SpinnerActions.showSpinner());
    }

    hideSpinner() {
        this.store.dispatch(SpinnerActions.hideSpinner());
    }
}