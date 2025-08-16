/**
 * Application-wide constants
 */
export class AppConstants {
    // Theme-related constants
    static readonly THEME_STORAGE_KEY = 'theme';
    static readonly THEME_DARK = 'dark';
    static readonly THEME_LIGHT = 'light';
    static readonly THEME_SOLARIZED = 'solarized';
    static readonly THEME_MONOKAI = 'monokai';
    static readonly DARK_THEME_CLASS = 'dark-theme';
    static readonly SOLARIZED_THEME_CLASS = 'solarized-theme';
    static readonly MONOKAI_THEME_CLASS = 'monokai-theme';
    static readonly PREFERS_DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';
}