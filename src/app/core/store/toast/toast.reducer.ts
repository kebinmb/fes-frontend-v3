import { createReducer, on } from "@ngrx/store";
import { initialState } from "./toast.state";
import * as ToastActions from "./toast.actions";
export const toastReducer = createReducer(
    initialState,
    on(ToastActions.showToast, (state, { id, message, toastType }) => ({
        ...state,
        toast: [...state.toast, { id, message, toastType }]
    })),

    on(ToastActions.removeToast, (state, { id }) => ({
        ...state,
        toast: state.toast.filter(t => t.id !== id)
    }))
);