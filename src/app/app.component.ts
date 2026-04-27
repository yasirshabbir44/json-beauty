import {Component, inject, OnInit} from '@angular/core';
import {CSPService} from './services/security/csp.service';
import {SecurityUtilsService} from './services/security/security-utils.service';
import {SettingsService} from './services/settings/settings.service';

/**
 * Application shell: layout, security bootstrap, and settings the template can bind to.
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    readonly title = 'JSON Beauty';
    readonly currentYear = new Date().getFullYear();

    /** Exposed for template bindings; settings UI state lives in SettingsService (SRP). */
    readonly settings = inject(SettingsService);

    private readonly cspService = inject(CSPService);
    private readonly securityUtils = inject(SecurityUtilsService);

    ngOnInit(): void {
        this.cspService.initializeCSP();
        this.cspService.listenForViolations();
        this.securityUtils.initializeCSRFProtection();
    }
}
