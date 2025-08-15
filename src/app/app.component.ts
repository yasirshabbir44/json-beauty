import {Component, OnInit, Renderer2} from '@angular/core';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
    title = 'JSON Beauty';
    currentYear: number = new Date().getFullYear();
    isDarkMode = false;

    constructor(private renderer: Renderer2) {
    }

    ngOnInit(): void {
        // Check if user has a theme preference stored
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.isDarkMode = savedTheme === 'dark';
            this.applyTheme();
        } else {
            // Check if user prefers dark mode at OS level
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark) {
                this.isDarkMode = true;
                this.applyTheme();
            }
        }
    }

    toggleTheme(): void {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }

    private applyTheme(): void {
        if (this.isDarkMode) {
            this.renderer.addClass(document.body, 'dark-theme');
        } else {
            this.renderer.removeClass(document.body, 'dark-theme');
        }
    }
}
