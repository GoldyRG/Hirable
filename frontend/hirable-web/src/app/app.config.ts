import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router providers (this is what was missing)
    provideRouter(routes, withComponentInputBinding()),

    // HttpClient for API calls
    provideHttpClient(withFetch()),
  ]
};
