import {Component, OnInit} from '@angular/core';
import {CSPService} from './services/security/csp.service';
import {SecurityUtilsService} from './services/security/security-utils.service';
import {ThemeService, ThemeOption} from './services/theme/theme.service';
import {SettingsService} from './services/settings/settings.service';

/**
 * Main application component
 * Follows Single Responsibility Principle by delegating theme management to ThemeService
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'JSON Beauty';
    currentYear: number = new Date().getFullYear();
    
    // Theme options for the dropdown
    themeOptions: ThemeOption[] = [];

    constructor(
        private cspService: CSPService,
        private securityUtils: SecurityUtilsService,
        private themeService: ThemeService,
        private settingsService: SettingsService
    ) {
        // Get theme options from the theme service
        this.themeOptions = this.themeService.getThemeOptions();
    }

    ngOnInit(): void {
        // Initialize Content Security Policy
        this.cspService.initializeCSP();
        this.cspService.listenForViolations();
        
        // Initialize CSRF protection
        this.securityUtils.initializeCSRFProtection();
        
        // Theme initialization is now handled by the ThemeService
    }

    /**
     * Toggle between light and dark themes
     * Delegates to ThemeService
     */
    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
    
    /**
     * Set a specific theme
     * Delegates to ThemeService
     * @param theme The theme to set
     */
    setTheme(theme: string): void {
        this.themeService.setTheme(theme);
    }
    
    /**
     * Check if current theme is dark
     * Delegates to ThemeService
     * @returns True if current theme is dark
     */
    isDarkTheme(): boolean {
        return this.themeService.isDarkTheme();
    }
    
    /**
     * Get the current theme
     * @returns Current theme value
     */
    getCurrentTheme(): string {
        return this.themeService.getCurrentTheme();
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
