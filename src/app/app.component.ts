import {Component, OnInit, Renderer2} from '@angular/core';
import {AppConstants} from './constants/app.constants';
import {CSPService} from './services/security/csp.service';
import {SecurityUtilsService} from './services/security/security-utils.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'JSON Beauty';
    currentYear: number = new Date().getFullYear();
    currentTheme = AppConstants.THEME_LIGHT;
    
    // Theme options for the dropdown
    themeOptions = [
        { value: AppConstants.THEME_LIGHT, label: 'Light' },
        { value: AppConstants.THEME_DARK, label: 'Dark' },
        { value: AppConstants.THEME_SOLARIZED, label: 'Solarized' },
        { value: AppConstants.THEME_MONOKAI, label: 'Monokai' }
    ];

    constructor(
        private renderer: Renderer2,
        private cspService: CSPService,
        private securityUtils: SecurityUtilsService
    ) {
    }

    ngOnInit(): void {
        // Initialize Content Security Policy
        this.cspService.initializeCSP();
        this.cspService.listenForViolations();
        
        // Initialize CSRF protection
        this.securityUtils.initializeCSRFProtection();
        
        // Check if user has a theme preference stored
        const savedTheme = localStorage.getItem(AppConstants.THEME_STORAGE_KEY);
        if (savedTheme) {
            this.currentTheme = savedTheme;
            this.applyTheme();
        } else {
            // Check if user prefers dark mode at OS level
            const prefersDark = window.matchMedia(AppConstants.PREFERS_DARK_MEDIA_QUERY).matches;
            if (prefersDark) {
                this.currentTheme = AppConstants.THEME_DARK;
                this.applyTheme();
            }
        }
    }

    // For backward compatibility with the simple toggle button
    toggleTheme(): void {
        // Toggle between light and dark only
        this.currentTheme = this.isDarkTheme() ? AppConstants.THEME_LIGHT : AppConstants.THEME_DARK;
        this.applyTheme();
        localStorage.setItem(AppConstants.THEME_STORAGE_KEY, this.currentTheme);
    }
    
    // Set a specific theme
    setTheme(theme: string): void {
        this.currentTheme = theme;
        this.applyTheme();
        localStorage.setItem(AppConstants.THEME_STORAGE_KEY, theme);
    }
    
    // Helper method to check if current theme is dark
    isDarkTheme(): boolean {
        return this.currentTheme === AppConstants.THEME_DARK || 
               this.currentTheme === AppConstants.THEME_MONOKAI;
    }

    private applyTheme(): void {
        // Remove all theme classes first
        this.renderer.removeClass(document.body, AppConstants.DARK_THEME_CLASS);
        this.renderer.removeClass(document.body, AppConstants.SOLARIZED_THEME_CLASS);
        this.renderer.removeClass(document.body, AppConstants.MONOKAI_THEME_CLASS);
        
        // Apply the appropriate theme class
        switch (this.currentTheme) {
            case AppConstants.THEME_DARK:
                this.renderer.addClass(document.body, AppConstants.DARK_THEME_CLASS);
                break;
            case AppConstants.THEME_SOLARIZED:
                this.renderer.addClass(document.body, AppConstants.SOLARIZED_THEME_CLASS);
                break;
            case AppConstants.THEME_MONOKAI:
                this.renderer.addClass(document.body, AppConstants.MONOKAI_THEME_CLASS);
                break;
            // Light theme is the default, no class needed
        }
    }
}
