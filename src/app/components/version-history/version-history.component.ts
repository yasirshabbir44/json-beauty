import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Subscription} from 'rxjs';
import {JsonVersion, VersionHistoryService} from '../../services/history/version-history.service';

@Component({
  selector: 'app-version-history',
  templateUrl: './version-history.component.html',
  styleUrls: ['./version-history.component.scss']
})
export class VersionHistoryComponent implements OnInit, OnDestroy {
  @Output() versionSelected = new EventEmitter<string>();
  
  versions: JsonVersion[] = [];
  versionNameControl = new FormControl('');
  editingVersionId: string | null = null;
  isOpen = false;
  
  private subscription: Subscription | null = null;

  constructor(
    private versionHistoryService: VersionHistoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.subscription = this.versionHistoryService.versions$.subscribe(versions => {
      this.versions = versions;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Toggles the visibility of the version history panel
   */
  togglePanel(): void {
    this.isOpen = !this.isOpen;
  }

  /**
   * Formats a date for display
   * @param date The date to format
   * @returns Formatted date string
   */
  formatDate(date: Date): string {
    return date.toLocaleString();
  }

  /**
   * Loads a version into the editor
   * @param version The version to load
   */
  loadVersion(version: JsonVersion): void {
    this.versionSelected.emit(version.content);
    this.showSuccess(`Loaded version from ${this.formatDate(version.timestamp)}`);
  }

  /**
   * Starts editing a version name
   * @param version The version to edit
   * @param event The click event
   */
  startEditName(version: JsonVersion, event: MouseEvent): void {
    event.stopPropagation();
    this.editingVersionId = version.id;
    this.versionNameControl.setValue(version.name || '');
  }

  /**
   * Saves the edited version name
   * @param version The version being edited
   * @param event The click event
   */
  saveVersionName(version: JsonVersion, event: MouseEvent): void {
    event.stopPropagation();
    const newName = this.versionNameControl.value || '';
    
    if (this.versionHistoryService.updateVersionName(version.id, newName)) {
      this.showSuccess('Version name updated');
    } else {
      this.showError('Failed to update version name');
    }
    
    this.editingVersionId = null;
  }

  /**
   * Deletes a version
   * @param versionId The ID of the version to delete
   * @param event The click event
   */
  deleteVersion(versionId: string, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.versionHistoryService.deleteVersion(versionId)) {
      this.showSuccess('Version deleted');
    } else {
      this.showError('Failed to delete version');
    }
  }

  /**
   * Clears all version history
   */
  clearHistory(): void {
    if (confirm('Are you sure you want to clear all version history? This cannot be undone.')) {
      this.versionHistoryService.clearHistory();
      this.showSuccess('Version history cleared');
    }
  }

  /**
   * Shows a success message
   * @param message The message to show
   */
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }

  /**
   * Shows an error message
   * @param message The message to show
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }
}