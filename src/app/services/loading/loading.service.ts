import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface for loading state
 */
export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress: number;
  operation: string;
}

/**
 * Service for managing loading states and progress indicators
 * This service provides methods to show/hide loading indicators
 * and update progress information for long-running operations
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // Default loading state
  private defaultState: LoadingState = {
    isLoading: false,
    message: 'Loading...',
    progress: 0,
    operation: ''
  };

  // BehaviorSubject to track loading state
  private loadingSubject = new BehaviorSubject<LoadingState>(this.defaultState);

  // Observable for components to subscribe to
  public loading$: Observable<LoadingState> = this.loadingSubject.asObservable();

  constructor() { }

  /**
   * Shows the loading indicator
   * @param message The message to display
   * @param operation The name of the operation
   */
  startLoading(message: string = 'Loading...', operation: string = ''): void {
    this.loadingSubject.next({
      isLoading: true,
      message,
      progress: 0,
      operation
    });
  }

  /**
   * Updates the progress of the current operation
   * @param progress The progress value (0-100)
   * @param message Optional new message to display
   */
  updateProgress(progress: number, message?: string): void {
    const currentState = this.loadingSubject.value;
    
    this.loadingSubject.next({
      ...currentState,
      progress: Math.min(Math.max(progress, 0), 100), // Ensure progress is between 0-100
      message: message || currentState.message
    });
  }

  /**
   * Hides the loading indicator
   */
  stopLoading(): void {
    this.loadingSubject.next(this.defaultState);
  }

  /**
   * Gets the current loading state
   * @returns The current loading state
   */
  getCurrentState(): LoadingState {
    return this.loadingSubject.value;
  }

  /**
   * Checks if a specific operation is in progress
   * @param operation The operation name to check
   * @returns True if the specified operation is in progress
   */
  isOperationInProgress(operation: string): boolean {
    const currentState = this.loadingSubject.value;
    return currentState.isLoading && currentState.operation === operation;
  }

  /**
   * Wraps a promise with loading indicators
   * @param promise The promise to wrap
   * @param message The loading message
   * @param operation The operation name
   * @returns The wrapped promise
   */
  async wrapPromise<T>(
    promise: Promise<T>, 
    message: string = 'Loading...', 
    operation: string = ''
  ): Promise<T> {
    try {
      this.startLoading(message, operation);
      return await promise;
    } finally {
      this.stopLoading();
    }
  }

  /**
   * Creates a progress callback function for use with async operations
   * @param operation The operation name
   * @returns A callback function that updates progress
   */
  createProgressCallback(operation: string): (progress: number, message?: string) => void {
    return (progress: number, message?: string) => {
      if (this.isOperationInProgress(operation)) {
        this.updateProgress(progress, message);
      }
    };
  }
}