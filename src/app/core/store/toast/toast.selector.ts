import { createFeatureSelector, createSelector, select } from "@ngrx/store";
import { ToastState } from "./toast.state";

export const selectToastState = createFeatureSelector<ToastState>('toast');
export const selectToasts = createSelector(selectToastState, state => state.toast)