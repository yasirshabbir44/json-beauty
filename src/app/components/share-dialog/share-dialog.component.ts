import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface ShareDialogData {
  shareableUrl: string;
  jsonContent: string;
}

@Component({
  selector: 'app-share-dialog',
  templateUrl: './share-dialog.component.html',
  styleUrls: ['./share-dialog.component.scss']
})
export class ShareDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ShareDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShareDialogData,
    private snackBar: MatSnackBar
  ) {}
  
  /**
   * Encodes a URI component for safe use in URLs
   * @param str The string to encode
   * @returns The encoded string
   */
  encodeURIComponent(str: string): string {
    return window.encodeURIComponent(str);
  }

  /**
   * Copies the shareable URL to the clipboard
   */
  copyUrl(): void {
    navigator.clipboard.writeText(this.data.shareableUrl)
      .then(() => {
        this.showSuccess('URL copied to clipboard');
      })
      .catch(err => {
        this.showError('Failed to copy URL: ' + err);
      });
  }

  /**
   * Copies the JSON content to the clipboard
   */
  copyJson(): void {
    navigator.clipboard.writeText(this.data.jsonContent)
      .then(() => {
        this.showSuccess('JSON copied to clipboard');
      })
      .catch(err => {
        this.showError('Failed to copy JSON: ' + err);
      });
  }

  /**
   * Opens the shareable URL in a new tab
   */
  openInNewTab(): void {
    window.open(this.data.shareableUrl, '_blank');
  }

  /**
   * Closes the dialog
   */
  close(): void {
    this.dialogRef.close();
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