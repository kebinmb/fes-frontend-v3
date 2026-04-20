import { createFeatureSelector, createSelector } from "@ngrx/store";
import { SpinnerState } from "./spinner.state";

export const selectSpinner = createFeatureSelector<SpinnerState>('spinner');
export const selectLoading = createSelector(
    selectSpinner,
    state => state.loading
);