import { inject, Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { AuthFacade } from "../auth/auth.facade";

@Injectable({
    providedIn:'root'
})
export class StudentDataFacade{
    private store = inject(Store);
    private authFacade = inject(AuthFacade);
    
}