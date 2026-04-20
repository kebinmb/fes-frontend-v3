import { inject, Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import * as ToastActions from "./toast.actions";
import { selectToasts } from "./toast.selector";
@Injectable({
    providedIn: 'root',
})
export class ToastFacade {
    private store = inject(Store);
    toast$ = this.store.select(selectToasts);

    showToast(message: string, toastType: 'success' | 'error') {
        const id = crypto.randomUUID();
        this.store.dispatch(
            ToastActions.showToast({ id, message, toastType })
        );
    }

    removeToast(id: string) {
        this.store.dispatch(
            ToastActions.removeToast({ id })
        );
    }
}