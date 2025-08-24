import { Injectable } from '@angular/core';
import { LoadingService } from '../loading/loading.service';
import { BaseWorkerService } from './base-worker.service';
import { IJsonParsingService } from './worker.interfaces';

/**
 * Service for JSON parsing and formatting operations
 * Follows Single Responsibility Principle by focusing only on JSON parsing operations
 * Extends BaseWorkerService for worker functionality
 * Implements IJsonParsingService interface following Dependency Inversion Principle
 */
@Injectable({
  providedIn: 'root'
})
export class JsonParsingService extends BaseWorkerService implements IJsonParsingService {
  constructor(protected override loadingService: LoadingService) {
    super(loadingService);
  }

  /**
   * Parse a JSON string into an object
   * @param jsonString The JSON string to parse
   * @returns Promise with the parsed JSON object
   */
  parseJson(jsonString: string): Promise<any> {
    return this.runInWorker('parseJson', { jsonString });
  }

  /**
   * Convert a JSON object to a string
   * @param jsonObject The JSON object to stringify
   * @param space Number of spaces for indentation
   * @returns Promise with the JSON string
   */
  stringifyJson(jsonObject: any, space: number = 2): Promise<string> {
    return this.runInWorker('stringifyJson', { jsonObject, space });
  }

  /**
   * Beautify a JSON string with proper formatting
   * @param jsonString The JSON string to beautify
   * @param space Number of spaces for indentation
   * @returns Promise with the beautified JSON string
   */
  beautifyJson(jsonString: string, space: number = 2): Promise<string> {
    return this.runInWorker('beautifyJson', { jsonString, space });
  }

  /**
   * Minify a JSON string by removing whitespace
   * @param jsonString The JSON string to minify
   * @returns Promise with the minified JSON string
   */
  minifyJson(jsonString: string): Promise<string> {
    return this.runInWorker('minifyJson', { jsonString });
  }

  /**
   * Validate a JSON string
   * @param jsonString The JSON string to validate
   * @returns Promise with validation result
   */
  validateJson(jsonString: string): Promise<{ valid: boolean; error?: string }> {
    return this.runInWorker('validateJson', { jsonString });
  }

  /**
   * Get the worker code as a string
   * Overrides the base method to provide JSON parsing specific worker code
   * @returns The worker code as a string
   */
  protected override getWorkerCode(): string {
    return `
      // Worker code for JSON parsing operations
      self.onmessage = function(e) {
        const { taskName, data } = e.data;
        
        try {
          // Process task based on taskName
          let result;
          
          switch (taskName) {
            case 'parseJson':
              result = JSON.parse(data.jsonString);
              break;
              
            case 'stringifyJson':
              result = JSON.stringify(data.jsonObject, null, data.space);
              break;
              
            case 'beautifyJson':
              // Parse and then stringify with formatting
              const parsedJson = JSON.parse(data.jsonString);
              result = JSON.stringify(parsedJson, null, data.space);
              break;
              
            case 'minifyJson':
              // Parse and then stringify without formatting
              const minifiedJson = JSON.parse(data.jsonString);
              result = JSON.stringify(minifiedJson);
              break;
              
            case 'validateJson':
              try {
                JSON.parse(data.jsonString);
                result = { valid: true };
              } catch (error) {
                result = { 
                  valid: false, 
                  error: error.message 
                };
              }
              break;
              
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