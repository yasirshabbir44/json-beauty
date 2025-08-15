import {Component, OnInit, Renderer2} from '@angular/core';
import {AppConstants} from './constants/app.constants';
import {LoadingService, LoadingState} from './services/loading/loading.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'JSON Beauty';
    currentYear: number = new Date().getFullYear();
    isDarkMode = false;
    loadingState: LoadingState = {
        isLoading: false,
        message: '',
        progress: 0,
        operation: ''
    };

    constructor(
        private renderer: Renderer2,
        private loadingService: LoadingService
    ) {
        // Subscribe to loading state changes
        this.loadingService.loading$.subscribe(state => {
            this.loadingState = state;
        });
    }

    ngOnInit(): void {
        // Check if user has a theme preference stored
        const savedTheme = localStorage.getItem(AppConstants.THEME_STORAGE_KEY);
        if (savedTheme) {
            this.isDarkMode = savedTheme === AppConstants.THEME_DARK;
            this.applyTheme();
        } else {
            // Check if user prefers dark mode at OS level
            const prefersDark = window.matchMedia(AppConstants.PREFERS_DARK_MEDIA_QUERY).matches;
            if (prefersDark) {
                this.isDarkMode = true;
                this.applyTheme();
            }
        }
    }

    toggleTheme(): void {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem(AppConstants.THEME_STORAGE_KEY, this.isDarkMode ? AppConstants.THEME_DARK : AppConstants.THEME_LIGHT);
    }

    private applyTheme(): void {
        if (this.isDarkMode) {
            this.renderer.addClass(document.body, AppConstants.DARK_THEME_CLASS);
        } else {
            this.renderer.removeClass(document.body, AppConstants.DARK_THEME_CLASS);
        }
    }
}
