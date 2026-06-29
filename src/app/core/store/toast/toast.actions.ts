import { createAction, props } from "@ngrx/store";
import { ToastType } from "./toast.state";

export const showToast = createAction(
  '[Toast] Show Toast',
  props<{ id: string; message: string; toastType: ToastType }>()
);

export const removeToast = createAction(
  '[Toast] Remove Toast',
  props<{ id: string }>()
);
