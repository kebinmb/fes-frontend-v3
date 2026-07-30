import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { installStaleBuildRecovery } from './app/utilities/stale-build-recovery';

installStaleBuildRecovery();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
