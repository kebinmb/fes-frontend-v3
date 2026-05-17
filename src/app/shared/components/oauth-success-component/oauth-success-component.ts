import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../core/store/auth/auth.facade';

@Component({
  selector: 'app-oauth-success-component',
  imports: [],
  templateUrl: './oauth-success-component.html',
  styleUrl: './oauth-success-component.css',
})
export class OauthSuccessComponent {
private authFacade = inject(AuthFacade);

  ngOnInit(): void {
    this.authFacade.checkLoggedInUserAuthentication();
  }
}
