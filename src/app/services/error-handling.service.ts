import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  constructor(private snackBar: MatSnackBar) { }

  /**
   * Handles errors and displays a snackbar message
   * @param error The error to handle
   * @param friendlyMessage A user-friendly message to display
   * @returns An observable that errors with the original error
   */
  handleError(error: any, friendlyMessage: string = 'An error occurred'): Observable<never> {
    // Log the error to the console
    console.error('Error occurred:', error);

    // Display a user-friendly message
    this.showErrorMessage(friendlyMessage);

    // Return an observable that errors with the original error
    return throwError(() => error);
  }

  /**
   * Shows an error message in a snackbar
   * @param message The message to display
   */
  showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Shows a success message in a snackbar
   * @param message The message to display
   */
  showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  /**
   * Formats an error message from an error object
   * @param error The error object
   * @returns A formatted error message
   */
  formatErrorMessage(error: any): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else if (error && error.error && error.error.message) {
      return error.error.message;
    } else {
      return 'An unknown error occurred';
    }
  }
}