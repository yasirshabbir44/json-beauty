import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConstants } from '../../constants/app.constants';

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

  // Current theme subject for state management
  private currentThemeSubject = new BehaviorSubject<string>(AppConstants.THEME_LIGHT);
  
  // Observable for components to subscribe to
  public currentTheme$: Observable<string> = this.currentThemeSubject.asObservable();
  
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    // Create a renderer instance
    this.renderer = rendererFactory.createRenderer(null, null);
    
    // Initialize theme on service creation
    this.initializeTheme();
  }

  /**
   * Initialize theme based on user preferences
   */
  private initializeTheme(): void {
    // Check if user has a theme preference stored
    const savedTheme = localStorage.getItem(AppConstants.THEME_STORAGE_KEY);
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      // Check if user prefers dark mode at OS level
      const prefersDark = window.matchMedia(AppConstants.PREFERS_DARK_MEDIA_QUERY).matches;
      if (prefersDark) {
        this.setTheme(AppConstants.THEME_DARK);
      }
    }
  }

  /**
   * Get all available theme options
   * @returns Array of theme options
   */
  getThemeOptions(): ThemeOption[] {
    return [...this.themeOptions];
  }

  /**
   * Get the current theme
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
    // Toggle between light and dark only
    const newTheme = this.isDarkTheme() ? AppConstants.THEME_LIGHT : AppConstants.THEME_DARK;
    this.setTheme(newTheme);
  }

  /**
   * Set a specific theme
   * @param theme The theme to set
   */
  setTheme(theme: string): void {
    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
    localStorage.setItem(AppConstants.THEME_STORAGE_KEY, theme);
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

  /**
   * Apply the theme to the document body
   * @param theme The theme to apply
   */
  private applyTheme(theme: string): void {
    // Remove all theme classes first
    this.renderer.removeClass(document.body, AppConstants.DARK_THEME_CLASS);
    this.renderer.removeClass(document.body, AppConstants.SOLARIZED_THEME_CLASS);
    this.renderer.removeClass(document.body, AppConstants.MONOKAI_THEME_CLASS);
    
    // Apply the appropriate theme class
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
      // Light theme is the default, no class needed
    }
  }
}