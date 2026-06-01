import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DEFAULT_FORMATTING_OPTIONS, FormattingOptions } from '../models/json-editor.models';

/** User-chosen app theme; `system` follows OS light/dark preference. */
export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppConfig {
  theme: ThemePreference;
  indentSize: number;
  indentChar: string;
  sortKeysOnFormat: boolean;
  trailingNewline: boolean;
  escapeUnicode: boolean;
  defaultOutputFormat: string;
  maxHistoryItems: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private readonly STORAGE_KEY = 'json-beauty-config';

  private defaultConfig: AppConfig = {
    theme: 'light',
    indentSize: DEFAULT_FORMATTING_OPTIONS.indentSize,
    indentChar: DEFAULT_FORMATTING_OPTIONS.indentChar,
    sortKeysOnFormat: DEFAULT_FORMATTING_OPTIONS.sortKeys,
    trailingNewline: DEFAULT_FORMATTING_OPTIONS.trailingNewline,
    escapeUnicode: DEFAULT_FORMATTING_OPTIONS.escapeUnicode,
    defaultOutputFormat: 'json',
    maxHistoryItems: 10
  };

  private configSubject: BehaviorSubject<AppConfig>;

  constructor() {
    const savedConfig = this.loadFromStorage();
    this.configSubject = new BehaviorSubject<AppConfig>(savedConfig || this.defaultConfig);
  }

  getConfig(): AppConfig {
    return this.configSubject.value;
  }

  getConfig$(): Observable<AppConfig> {
    return this.configSubject.asObservable();
  }

  getFormattingOptions(): FormattingOptions {
    const config = this.getConfig();
    return {
      indentSize: config.indentSize,
      indentChar: config.indentChar === '\t' ? '\t' : ' ',
      sortKeys: config.sortKeysOnFormat,
      trailingNewline: config.trailingNewline,
      escapeUnicode: config.escapeUnicode,
    };
  }

  updateConfig(config: Partial<AppConfig>): void {
    const updatedConfig = { ...this.configSubject.value, ...config };
    this.configSubject.next(updatedConfig);
    this.saveToStorage(updatedConfig);
  }

  updateFormattingOptions(options: FormattingOptions): void {
    this.updateConfig({
      indentSize: options.indentSize,
      indentChar: options.indentChar,
      sortKeysOnFormat: options.sortKeys,
      trailingNewline: options.trailingNewline,
      escapeUnicode: options.escapeUnicode,
    });
  }

  resetConfig(): void {
    this.configSubject.next(this.defaultConfig);
    this.saveToStorage(this.defaultConfig);
  }

  private loadFromStorage(): AppConfig | null {
    try {
      const storedConfig = localStorage.getItem(this.STORAGE_KEY);
      if (!storedConfig) {
        return null;
      }
      const parsed = JSON.parse(storedConfig) as Partial<AppConfig>;
      return { ...this.defaultConfig, ...parsed };
    } catch (error) {
      console.error('Error loading configuration from storage:', error);
      return null;
    }
  }

  private saveToStorage(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving configuration to storage:', error);
    }
  }
}
