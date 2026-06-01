import {isDevMode, NgModule} from '@angular/core';
import {ServiceWorkerModule} from '@angular/service-worker';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {MAT_RIPPLE_GLOBAL_OPTIONS} from '@angular/material/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS} from '@angular/material/button-toggle';

import {AppComponent} from './app.component';
import {AppShellModule} from './modules/app-shell/app-shell.module';

@NgModule({
    declarations: [AppComponent],
    bootstrap: [AppComponent],
    imports: [
        AppShellModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
        })
    ],
    providers: [
        provideHttpClient(withInterceptorsFromDi()),
        {provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: {disabled: true, animation: {enterDuration: 0, exitDuration: 0}}},
        {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline', subscriptSizing: 'dynamic'}},
        {provide: MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS, useValue: {hideSingleSelectionIndicator: true}},
    ]
})
export class AppModule {
}
