import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Service responsible for managing application settings
 * Follows Single Responsibility Principle by encapsulating all settings-related functionality
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  // Formatting options
  private showFormattingOptionsSubject = new BehaviorSubject<boolean>(false);
  public showFormattingOptions$: Observable<boolean> = this.showFormattingOptionsSubject.asObservable();

  // Keyboard shortcuts
  private showKeyboardShortcutsSubject = new BehaviorSubject<boolean>(false);
  public showKeyboardShortcuts$: Observable<boolean> = this.showKeyboardShortcutsSubject.asObservable();

  // Search and replace
  private showSearchReplaceSubject = new BehaviorSubject<boolean>(false);
  public showSearchReplace$: Observable<boolean> = this.showSearchReplaceSubject.asObservable();

  constructor() { }

  /**
   * Toggle formatting options visibility
   */
  toggleFormattingOptions(): void {
    this.showFormattingOptionsSubject.next(!this.showFormattingOptionsSubject.value);
  }

  /**
   * Get current formatting options visibility state
   * @returns Current formatting options visibility
   */
  getFormattingOptionsState(): boolean {
    return this.showFormattingOptionsSubject.value;
  }

  /**
   * Toggle keyboard shortcuts visibility
   */
  toggleKeyboardShortcuts(): void {
    this.showKeyboardShortcutsSubject.next(!this.showKeyboardShortcutsSubject.value);
  }

  /**
   * Get current keyboard shortcuts visibility state
   * @returns Current keyboard shortcuts visibility
   */
  getKeyboardShortcutsState(): boolean {
    return this.showKeyboardShortcutsSubject.value;
  }

  /**
   * Toggle search and replace visibility
   */
  toggleSearchReplace(): void {
    this.showSearchReplaceSubject.next(!this.showSearchReplaceSubject.value);
  }

  /**
   * Get current search and replace visibility state
   * @returns Current search and replace visibility
   */
  getSearchReplaceState(): boolean {
    return this.showSearchReplaceSubject.value;
  }
}