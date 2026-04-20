export interface Toast {
  id: string;
  message: string;
  toastType: 'success' | 'error';
}

export interface ToastState {
    toast: Toast[];
}

export const initialState: ToastState = {
    toast: []
}