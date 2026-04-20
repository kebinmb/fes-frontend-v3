import { createReducer, on } from "@ngrx/store";
import { initialSpinnerState } from "./spinner.state";
import * as SpinnerActions from "./spinner.action";
export const spinnerReducer = createReducer(
    initialSpinnerState,
    on(SpinnerActions.showSpinner, state => ({
        ...state,
        loading: true
    })),
    on(SpinnerActions.hideSpinner, state => ({
        ...state,
        loading: false
    }))
)