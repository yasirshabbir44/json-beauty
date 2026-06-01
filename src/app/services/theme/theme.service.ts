import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConstants } from '../../constants/app.constants';
import { ConfigurationService, ThemePreference } from '../configuration.service';

/**
 * Interface for theme options
 */
export interface ThemeOption {
  value: string;
  label: string;
}

/**
 * Service responsible for managing application themes
 * Follows Single Responsibility Principle by encapsulating all theme-related functionality
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Available theme options
  private themeOptions: ThemeOption[] = [
    { value: AppConstants.THEME_LIGHT, label: 'Light' },
    { value: AppConstants.THEME_DARK, label: 'Dark' },
    { value: AppConstants.THEME_SOLARIZED, label: 'Solarized' },
    { value: AppConstants.THEME_MONOKAI, label: 'Monokai' }
  ];

  // Current resolved theme (light, dark, solarized, monokai)
  private currentThemeSubject = new BehaviorSubject<string>(AppConstants.THEME_LIGHT);

  // Observable for components to subscribe to
  public currentTheme$: Observable<string> = this.currentThemeSubject.asObservable();

  private renderer: Renderer2;
  private systemThemeListener?: (event: MediaQueryListEvent) => void;

  constructor(
    rendererFactory: RendererFactory2,
    private configService: ConfigurationService
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.migrateLegacyThemeStorage();
    this.listenForSystemThemeChanges();
    this.configService.getConfig$().subscribe((config) => {
      this.applyThemePreference(config.theme);
    });
  }

  private migrateLegacyThemeStorage(): void {
    const legacy = localStorage.getItem(AppConstants.THEME_STORAGE_KEY);
    if (!legacy) {
      return;
    }

    const preference = this.legacyThemeToPreference(legacy);
    this.configService.updateConfig({ theme: preference });
    localStorage.removeItem(AppConstants.THEME_STORAGE_KEY);
  }

  private legacyThemeToPreference(legacy: string): ThemePreference {
    if (legacy === AppConstants.THEME_DARK || legacy === AppConstants.THEME_MONOKAI) {
      return 'dark';
    }
    return 'light';
  }

  private listenForSystemThemeChanges(): void {
    const media = window.matchMedia(AppConstants.PREFERS_DARK_MEDIA_QUERY);
    this.systemThemeListener = () => {
      if (this.configService.getConfig().theme === 'system') {
        this.applyThemePreference('system');
      }
    };
    media.addEventListener('change', this.systemThemeListener);
  }

  /**
   * Get all available theme options
   * @returns Array of theme options
   */
  getThemeOptions(): ThemeOption[] {
    return [...this.themeOptions];
  }

  /**
   * Saved theme preference (may be `system`).
   */
  getThemePreference(): ThemePreference {
    return this.configService.getConfig().theme;
  }

  /**
   * Persist and apply a theme preference.
   */
  setThemePreference(preference: ThemePreference): void {
    this.configService.updateConfig({ theme: preference });
  }

  /**
   * Get the current resolved theme
   * @returns Current theme value
   */
  getCurrentTheme(): string {
    return this.currentThemeSubject.value;
  }

  /**
   * Toggle between light and dark themes
   * For backward compatibility with the simple toggle button
   */
  toggleTheme(): void {
    const newPreference: ThemePreference = this.isDarkTheme() ? 'light' : 'dark';
    this.setThemePreference(newPreference);
  }

  /**
   * Set a specific resolved theme (legacy API; maps to light/dark preference).
   * @param theme The theme to set
   */
  setTheme(theme: string): void {
    const preference: ThemePreference =
      theme === AppConstants.THEME_DARK || theme === AppConstants.THEME_MONOKAI
        ? 'dark'
        : 'light';
    this.setThemePreference(preference);
  }

  /**
   * Check if current theme is a dark theme
   * @returns True if current theme is dark
   */
  isDarkTheme(): boolean {
    const currentTheme = this.currentThemeSubject.value;
    return currentTheme === AppConstants.THEME_DARK ||
           currentTheme === AppConstants.THEME_MONOKAI;
  }

  private applyThemePreference(preference: ThemePreference): void {
    const resolved = this.resolveTheme(preference);
    this.currentThemeSubject.next(resolved);
    this.applyTheme(resolved);
  }

  private resolveTheme(preference: ThemePreference): string {
    if (preference === 'system') {
      return window.matchMedia(AppConstants.PREFERS_DARK_MEDIA_QUERY).matches
        ? AppConstants.THEME_DARK
        : AppConstants.THEME_LIGHT;
    }
    return preference;
  }

  /**
   * Apply the theme to the document body
   * @param theme The theme to apply
   */
  private applyTheme(theme: string): void {
    this.renderer.removeClass(document.body, AppConstants.DARK_THEME_CLASS);
    this.renderer.removeClass(document.body, AppConstants.SOLARIZED_THEME_CLASS);
    this.renderer.removeClass(document.body, AppConstants.MONOKAI_THEME_CLASS);

    switch (theme) {
      case AppConstants.THEME_DARK:
        this.renderer.addClass(document.body, AppConstants.DARK_THEME_CLASS);
        break;
      case AppConstants.THEME_SOLARIZED:
        this.renderer.addClass(document.body, AppConstants.SOLARIZED_THEME_CLASS);
        break;
      case AppConstants.THEME_MONOKAI:
        this.renderer.addClass(document.body, AppConstants.MONOKAI_THEME_CLASS);
        break;
    }
  }
}
