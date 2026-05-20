import {Component, DestroyRef, inject, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {CSPService} from './services/security/csp.service';
import {SecurityUtilsService} from './services/security/security-utils.service';
import {SettingsService} from './services/settings/settings.service';
import {ThemeService} from './services/theme/theme.service';

/**
 * Application shell: layout, security bootstrap, and settings the template can bind to.
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {
    readonly title = 'JSON Beauty';
    readonly currentYear = new Date().getFullYear();

    /** Exposed for template bindings; settings UI state lives in SettingsService (SRP). */
    readonly settings = inject(SettingsService);
    isDarkTheme = false;
    isLandingRoute = false;

    private readonly router = inject(Router);
    private readonly cspService = inject(CSPService);
    private readonly securityUtils = inject(SecurityUtilsService);
    private readonly themeService = inject(ThemeService);
    private readonly destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.cspService.initializeCSP();
        this.cspService.listenForViolations();
        this.securityUtils.initializeCSRFProtection();

        this.isDarkTheme = this.themeService.isDarkTheme();
        this.themeService.currentTheme$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.isDarkTheme = this.themeService.isDarkTheme();
            });

        this.syncLandingRoute(this.router.url);
        this.router.events
            .pipe(
                filter((e): e is NavigationEnd => e instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef)
            )
            .subscribe((e) => this.syncLandingRoute(e.urlAfterRedirects));
    }

    private syncLandingRoute(url: string): void {
        const path = url.split('?')[0].split('#')[0];
        this.isLandingRoute = path === '/' || path === '';
    }

    toggleTheme(): void {
        this.themeService.toggleTheme();
    }
}
