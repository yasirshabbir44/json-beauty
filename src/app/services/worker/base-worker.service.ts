import { Injectable } from '@angular/core';
import { LoadingService } from '../loading/loading.service';
import { IWorkerService } from './worker.interfaces';

/**
 * Base service for web worker operations
 * Follows Single Responsibility Principle by focusing only on worker management
 * Implements IWorkerService interface following Dependency Inversion Principle
 */
@Injectable({
  providedIn: 'root'
})
export class BaseWorkerService implements IWorkerService {
  constructor(protected loadingService: LoadingService) {}

  /**
   * Run a task in a web worker
   * @param taskName The name of the task to run
   * @param data The data to pass to the worker
   * @returns Promise with the result of the worker task
   */
  runInWorker<T, U>(taskName: string, data: T): Promise<U> {
    return new Promise((resolve, reject) => {
      try {
        // Show loading indicator
        this.loadingService.startLoading(`Processing ${taskName}...`, taskName);
        
        // Create a new worker
        const workerBlob = new Blob([this.getWorkerCode()], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(workerBlob);
        const worker = new Worker(workerUrl);
        
        // Set up message handler
        worker.onmessage = (e) => {
          // Handle worker response
          if (e.data.error) {
            reject(e.data.error);
          } else {
            resolve(e.data.result);
          }
          
          // Clean up
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          this.loadingService.stopLoading();
        };
        
        // Set up error handler
        worker.onerror = (error) => {
          console.error('Worker error:', error);
          reject(new Error('Worker error: ' + error.message));
          
          // Clean up
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          this.loadingService.stopLoading();
        };
        
        // Post message to worker
        worker.postMessage({
          taskName,
          data
        });
        
        // Set up timeout to prevent hanging workers
        const timeout = 30000; // 30 seconds
        const timeoutId = setTimeout(() => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          this.loadingService.stopLoading();
          reject(new Error(`Task ${taskName} timed out after ${timeout / 1000} seconds`));
        }, timeout);
        
        // Clear timeout when worker completes
        const cleanupInterval = () => {
          clearTimeout(timeoutId);
        };
        
        // Add event listener to clean up on page unload
        window.addEventListener('beforeunload', (e) => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
          cleanupInterval();
          this.loadingService.stopLoading();
        }, { once: true });
      } catch (error) {
        this.loadingService.stopLoading();
        reject(error);
      }
    });
  }

  /**
   * Get the worker code as a string
   * This method should be overridden by subclasses to provide specific worker code
   * @returns The worker code as a string
   */
  protected getWorkerCode(): string {
    // Base worker code with common utilities
    return `
      // Worker code
      self.onmessage = function(e) {
        const { taskName, data } = e.data;
        
        try {
          // Process task based on taskName
          let result;
          
          switch (taskName) {
            default:
              throw new Error('Unknown task: ' + taskName);
          }
          
          // Send result back to main thread
          self.postMessage({ result });
        } catch (error) {
          // Send error back to main thread
          self.postMessage({ 
            error: { 
              message: error.message, 
              stack: error.stack 
            } 
          });
        }
      };
    `;
  }
}