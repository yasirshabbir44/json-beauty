import { Injectable } from '@angular/core';
import { LoadingService } from '../loading/loading.service';
import { BaseWorkerService } from './base-worker.service';
import { IJsonAnalysisService } from './worker.interfaces';

/**
 * Service for JSON analysis operations
 * Follows Single Responsibility Principle by focusing only on JSON analysis operations
 * Extends BaseWorkerService for worker functionality
 * Implements IJsonAnalysisService interface following Dependency Inversion Principle
 */
@Injectable({
  providedIn: 'root'
})
export class JsonAnalysisService extends BaseWorkerService implements IJsonAnalysisService {
  constructor(protected override loadingService: LoadingService) {
    super(loadingService);
  }

  /**
   * Compare two JSON strings
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns Promise with comparison result
   */
  compareJson(leftJsonString: string, rightJsonString: string): Promise<any> {
    return this.runInWorker('compareJson', { leftJsonString, rightJsonString });
  }

  /**
   * Query a JSON string using JSONPath
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath query
   * @returns Promise with query results
   */
  queryJsonPath(jsonString: string, jsonPath: string): Promise<any> {
    return this.runInWorker('queryJsonPath', { jsonString, jsonPath });
  }

  /**
   * Get the worker code as a string
   * Overrides the base method to provide JSON analysis specific worker code
   * @returns The worker code as a string
   */
  protected override getWorkerCode(): string {
    return `
      // Worker code for JSON analysis operations
      self.onmessage = function(e) {
        const { taskName, data } = e.data;
        
        try {
          // Process task based on taskName
          let result;
          
          switch (taskName) {
            case 'compareJson':
              // Compare two JSON strings
              result = compareJsonStrings(data.leftJsonString, data.rightJsonString);
              break;
              
            case 'queryJsonPath':
              // Query JSON using JSONPath
              result = queryJsonWithPath(data.jsonString, data.jsonPath);
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
      
      /**
       * Compare two JSON strings and return differences
       * @param leftJsonString First JSON string
       * @param rightJsonString Second JSON string
       * @returns Comparison result with differences
       */
      function compareJsonStrings(leftJsonString, rightJsonString) {
        try {
          // Parse JSON strings
          const leftObj = JSON.parse(leftJsonString);
          const rightObj = JSON.parse(rightJsonString);
          
          // Compare objects
          return {
            differences: findDifferences(leftObj, rightObj),
            leftValid: true,
            rightValid: true
          };
        } catch (error) {
          // Handle parsing errors
          let leftValid = true;
          let rightValid = true;
          
          try {
            JSON.parse(leftJsonString);
          } catch (e) {
            leftValid = false;
          }
          
          try {
            JSON.parse(rightJsonString);
          } catch (e) {
            rightValid = false;
          }
          
          return {
            differences: [],
            leftValid,
            rightValid,
            error: error.message
          };
        }
      }
      
      /**
       * Find differences between two objects
       * @param left First object
       * @param right Second object
       * @param path Current path (for recursion)
       * @returns Array of differences
       */
      function findDifferences(left, right, path = '') {
        // If types are different, return difference
        if (typeof left !== typeof right) {
          return [{
            path: path || '/',
            type: 'type',
            left: typeof left,
            right: typeof right
          }];
        }
        
        // If one is null and the other isn't
        if ((left === null && right !== null) || (left !== null && right === null)) {
          return [{
            path: path || '/',
            type: 'value',
            left,
            right
          }];
        }
        
        // If not objects, compare values
        if (typeof left !== 'object' || left === null) {
          if (left !== right) {
            return [{
              path: path || '/',
              type: 'value',
              left,
              right
            }];
          }
          return [];
        }
        
        // Handle arrays
        if (Array.isArray(left) && Array.isArray(right)) {
          const differences = [];
          
          // Check length difference
          if (left.length !== right.length) {
            differences.push({
              path: path || '/',
              type: 'length',
              left: left.length,
              right: right.length
            });
          }
          
          // Check array items
          const maxLength = Math.max(left.length, right.length);
          for (let i = 0; i < maxLength; i++) {
            if (i >= left.length) {
              differences.push({
                path: \`\${path}[\${i}]\`,
                type: 'missing',
                left: undefined,
                right: right[i]
              });
            } else if (i >= right.length) {
              differences.push({
                path: \`\${path}[\${i}]\`,
                type: 'missing',
                left: left[i],
                right: undefined
              });
            } else {
              // Recursively compare array items
              const itemDiffs = findDifferences(left[i], right[i], \`\${path}[\${i}]\`);
              differences.push(...itemDiffs);
            }
          }
          
          return differences;
        }
        
        // Handle objects
        const differences = [];
        const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
        
        for (const key of allKeys) {
          const leftHas = Object.prototype.hasOwnProperty.call(left, key);
          const rightHas = Object.prototype.hasOwnProperty.call(right, key);
          
          // Key exists in left but not in right
          if (leftHas && !rightHas) {
            differences.push({
              path: path ? \`\${path}.\${key}\` : key,
              type: 'missing',
              left: left[key],
              right: undefined
            });
          }
          // Key exists in right but not in left
          else if (!leftHas && rightHas) {
            differences.push({
              path: path ? \`\${path}.\${key}\` : key,
              type: 'missing',
              left: undefined,
              right: right[key]
            });
          }
          // Key exists in both, compare values
          else {
            const valueDiffs = findDifferences(
              left[key], 
              right[key], 
              path ? \`\${path}.\${key}\` : key
            );
            differences.push(...valueDiffs);
          }
        }
        
        return differences;
      }
      
      /**
       * Query JSON using JSONPath
       * @param jsonString JSON string to query
       * @param jsonPath JSONPath query
       * @returns Query results
       */
      function queryJsonWithPath(jsonString, jsonPath) {
        try {
          // Parse JSON
          const jsonObj = JSON.parse(jsonString);
          
          // Execute JSONPath query
          const result = executeJsonPath(jsonObj, jsonPath);
          
          return {
            result,
            valid: true
          };
        } catch (error) {
          return {
            result: [],
            valid: false,
            error: error.message
          };
        }
      }
      
      /**
       * Execute JSONPath query on object
       * @param obj Object to query
       * @param path JSONPath query
       * @returns Query results
       */
      function executeJsonPath(obj, path) {
        // Simple JSONPath implementation
        // For a full implementation, a library would be used
        
        // Handle root object
        if (path === '$' || path === '') {
          return [obj];
        }
        
        // Normalize path
        if (path.startsWith('$.')) {
          path = path.substring(2);
        } else if (path.startsWith('$')) {
          path = path.substring(1);
        }
        
        // Split path into segments
        const segments = path.split('.');
        let current = [obj];
        
        // Process each segment
        for (const segment of segments) {
          if (!segment) continue;
          
          const nextCurrent = [];
          
          // Handle array notation [*]
          if (segment === '[*]') {
            for (const item of current) {
              if (Array.isArray(item)) {
                nextCurrent.push(...item);
              }
            }
            continue;
          }
          
          // Handle array index [n]
          const arrayMatch = segment.match(/^\\[(\\d+)\\]$/);
          if (arrayMatch) {
            const index = parseInt(arrayMatch[1], 10);
            for (const item of current) {
              if (Array.isArray(item) && index < item.length) {
                nextCurrent.push(item[index]);
              }
            }
            continue;
          }
          
          // Handle property access
          for (const item of current) {
            if (typeof item === 'object' && item !== null) {
              if (Object.prototype.hasOwnProperty.call(item, segment)) {
                nextCurrent.push(item[segment]);
              }
            }
          }
          
          current = nextCurrent;
        }
        
        return current;
      }
    `;
  }
}