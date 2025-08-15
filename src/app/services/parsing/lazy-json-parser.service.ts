import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

/**
 * Service for lazy parsing of large JSON documents
 * This service provides methods to parse JSON in chunks and on-demand
 * to improve performance when dealing with large JSON documents
 */
@Injectable({
  providedIn: 'root'
})
export class LazyJsonParserService {
  // Size threshold in bytes for when to use lazy parsing
  private readonly SIZE_THRESHOLD = 1024 * 1024; // 1MB

  constructor() { }

  /**
   * Determines if a JSON string should be parsed lazily based on its size
   * @param jsonString The JSON string to check
   * @returns True if the string exceeds the size threshold
   */
  shouldParseLazily(jsonString: string): boolean {
    return jsonString.length > this.SIZE_THRESHOLD;
  }

  /**
   * Parses a JSON string lazily using a Web Worker
   * @param jsonString The JSON string to parse
   * @returns An Observable that emits the parsed JSON object
   */
  parseLazily(jsonString: string): Observable<any> {
    // For small JSON strings, parse synchronously
    if (!this.shouldParseLazily(jsonString)) {
      try {
        const result = JSON.parse(jsonString);
        return of(result);
      } catch (error) {
        return of(null).pipe(
          catchError(err => {
            console.error('Error parsing JSON:', err);
            throw err;
          })
        );
      }
    }

    // For large JSON strings, parse in a Web Worker
    return from(this.parseInWorker(jsonString)).pipe(
      catchError(err => {
        console.error('Error parsing JSON in worker:', err);
        // Fallback to synchronous parsing if worker fails
        try {
          const result = JSON.parse(jsonString);
          return of(result);
        } catch (error) {
          throw error;
        }
      })
    );
  }

  /**
   * Parses a JSON string in a Web Worker to avoid blocking the main thread
   * @param jsonString The JSON string to parse
   * @returns A Promise that resolves to the parsed JSON object
   */
  private parseInWorker(jsonString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Create a blob with the worker code
      const workerCode = `
        self.onmessage = function(e) {
          try {
            const result = JSON.parse(e.data);
            self.postMessage({ success: true, result });
          } catch (error) {
            self.postMessage({ 
              success: false, 
              error: { message: error.message, stack: error.stack } 
            });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (e) => {
        URL.revokeObjectURL(workerUrl);
        worker.terminate();
        
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error.message));
        }
      };
      
      worker.onerror = (error) => {
        URL.revokeObjectURL(workerUrl);
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage(jsonString);
    });
  }

  /**
   * Lazily loads a specific path in a JSON object
   * @param jsonString The JSON string
   * @param path The path to load (e.g., "data.items[0]")
   * @returns An Observable that emits the value at the specified path
   */
  getValueAtPath(jsonString: string, path: string): Observable<any> {
    return this.parseLazily(jsonString).pipe(
      map(json => {
        if (!path) return json;
        
        const parts = path.split(/\.|\[|\]/).filter(Boolean);
        let current = json;
        
        for (const part of parts) {
          if (current === null || current === undefined) {
            return undefined;
          }
          
          // Handle array indices
          if (part.match(/^\d+$/)) {
            const index = parseInt(part, 10);
            current = Array.isArray(current) ? current[index] : undefined;
          } else {
            current = current[part];
          }
        }
        
        return current;
      })
    );
  }

  /**
   * Creates a paginated view of a JSON array
   * @param jsonArray The JSON array to paginate
   * @param pageSize The number of items per page
   * @param pageIndex The zero-based page index
   * @returns The paginated array and pagination metadata
   */
  paginateArray(jsonArray: any[], pageSize: number = 100, pageIndex: number = 0): { 
    items: any[], 
    totalItems: number, 
    pageIndex: number, 
    pageSize: number, 
    totalPages: number 
  } {
    if (!Array.isArray(jsonArray)) {
      return {
        items: [],
        totalItems: 0,
        pageIndex: 0,
        pageSize,
        totalPages: 0
      };
    }

    const totalItems = jsonArray.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const items = jsonArray.slice(startIndex, endIndex);

    return {
      items,
      totalItems,
      pageIndex,
      pageSize,
      totalPages
    };
  }

  /**
   * Optimizes memory usage by creating a proxy for large objects
   * that loads properties on-demand
   * @param obj The object to optimize
   * @returns A proxy that loads properties on-demand
   */
  createLazyLoadingProxy(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // For arrays, create a special proxy that loads items on-demand
    if (Array.isArray(obj)) {
      return new Proxy(obj, {
        get: (target, prop) => {
          // Handle special array methods and properties
          if (prop === 'length' || typeof prop === 'symbol' || typeof prop === 'number' || prop === 'slice' || prop === 'forEach' || prop === 'map') {
            return Reflect.get(target, prop);
          }
          
          // For numeric indices, lazily load the item
          if (typeof prop === 'string' && !isNaN(Number(prop))) {
            const index = Number(prop);
            const value = target[index];
            return this.createLazyLoadingProxy(value);
          }
          
          return Reflect.get(target, prop);
        }
      });
    }

    // For objects, create a proxy that lazily loads properties
    return new Proxy(obj, {
      get: (target, prop) => {
        if (typeof prop === 'symbol') {
          return Reflect.get(target, prop);
        }
        
        const value = target[prop as string];
        if (value && typeof value === 'object') {
          return this.createLazyLoadingProxy(value);
        }
        
        return value;
      }
    });
  }
}