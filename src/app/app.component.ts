import {Component, OnInit} from '@angular/core';
import {CSPService} from './services/security/csp.service';
import {SecurityUtilsService} from './services/security/security-utils.service';
import {SettingsService} from './services/settings/settings.service';

/**
 * Main application component
 * Coordinates app-level security and UI settings actions
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    readonly title = 'JSON Beauty';
    readonly currentYear = new Date().getFullYear();

    constructor(
        private cspService: CSPService,
        private securityUtils: SecurityUtilsService,
        private settingsService: SettingsService
    ) {}

    ngOnInit(): void {
        // Initialize Content Security Policy
        this.cspService.initializeCSP();
        this.cspService.listenForViolations();
        
        // Initialize CSRF protection
        this.securityUtils.initializeCSRFProtection();
    }

    /**
     * Toggle formatting options visibility
     * Delegates to SettingsService
     */
    toggleFormattingOptions(): void {
        this.settingsService.toggleFormattingOptions();
    }

    /**
     * Toggle keyboard shortcuts visibility
     * Delegates to SettingsService
     */
    toggleKeyboardShortcuts(): void {
        this.settingsService.toggleKeyboardShortcuts();
    }

    /**
     * Toggle search and replace visibility
     * Delegates to SettingsService
     */
    toggleSearchReplace(): void {
        this.settingsService.toggleSearchReplace();
    }
}
