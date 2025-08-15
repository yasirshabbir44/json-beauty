import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppConfig {
  theme: 'light' | 'dark';
  indentSize: number;
  indentChar: string;
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
    indentSize: 2,
    indentChar: ' ',
    defaultOutputFormat: 'json',
    maxHistoryItems: 10
  };
  
  private configSubject: BehaviorSubject<AppConfig>;
  
  constructor() {
    // Load config from localStorage or use default
    const savedConfig = this.loadFromStorage();
    this.configSubject = new BehaviorSubject<AppConfig>(savedConfig || this.defaultConfig);
  }
  
  /**
   * Gets the current configuration
   * @returns The current configuration
   */
  getConfig(): AppConfig {
    return this.configSubject.value;
  }
  
  /**
   * Gets the configuration as an observable
   * @returns An observable of the configuration
   */
  getConfig$(): Observable<AppConfig> {
    return this.configSubject.asObservable();
  }
  
  /**
   * Updates the configuration
   * @param config The new configuration
   */
  updateConfig(config: Partial<AppConfig>): void {
    const updatedConfig = { ...this.configSubject.value, ...config };
    this.configSubject.next(updatedConfig);
    this.saveToStorage(updatedConfig);
  }
  
  /**
   * Resets the configuration to default
   */
  resetConfig(): void {
    this.configSubject.next(this.defaultConfig);
    this.saveToStorage(this.defaultConfig);
  }
  
  /**
   * Loads the configuration from localStorage
   * @returns The loaded configuration or null if not found
   */
  private loadFromStorage(): AppConfig | null {
    try {
      const storedConfig = localStorage.getItem(this.STORAGE_KEY);
      return storedConfig ? JSON.parse(storedConfig) : null;
    } catch (error) {
      console.error('Error loading configuration from storage:', error);
      return null;
    }
  }
  
  /**
   * Saves the configuration to localStorage
   * @param config The configuration to save
   */
  private saveToStorage(config: AppConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving configuration to storage:', error);
    }
  }
}