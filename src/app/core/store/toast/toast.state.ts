export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  toastType: ToastType;
}

export interface ToastState {
    toast: Toast[];
}

export const initialState: ToastState = {
    toast: []
}
