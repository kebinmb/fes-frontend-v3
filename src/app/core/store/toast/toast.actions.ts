import { createAction, props } from "@ngrx/store";

export const showToast = createAction(
  '[Toast] Show Toast',
  props<{ id: string; message: string; toastType: 'success' | 'error' }>()
);

export const removeToast = createAction(
  '[Toast] Remove Toast',
  props<{ id: string }>()
);