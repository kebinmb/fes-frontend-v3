import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { AuthFacade } from '../../../core/store/auth/auth.facade';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-oauth-success-component',
  imports: [],
  templateUrl: './oauth-success-component.html',
  styleUrl: './oauth-success-component.css',
})
export class OauthSuccessComponent {
  private readonly authFacade = inject(AuthFacade);

  ngOnInit(): void {
    this.authFacade.checkLoggedInUserAuthentication();
  }
}
