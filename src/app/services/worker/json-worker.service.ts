import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { LoadingService } from '../loading/loading.service';

/**
 * Service for offloading heavy JSON processing to Web Workers
 * This service helps improve UI responsiveness by moving CPU-intensive
 * operations off the main thread
 */
@Injectable({
  providedIn: 'root'
})
export class JsonWorkerService {
  constructor(private loadingService: LoadingService) { }

  /**
   * Parses a JSON string in a Web Worker
   * @param jsonString The JSON string to parse
   * @returns An Observable that emits the parsed JSON object
   */
  parseJson(jsonString: string): Observable<any> {
    return from(this.runInWorker('parseJson', jsonString));
  }

  /**
   * Stringifies a JSON object in a Web Worker
   * @param jsonObject The object to stringify
   * @param space The number of spaces to use for indentation
   * @returns An Observable that emits the JSON string
   */
  stringifyJson(jsonObject: any, space: number = 2): Observable<string> {
    return from(this.runInWorker('stringifyJson', { jsonObject, space }));
  }

  /**
   * Beautifies a JSON string in a Web Worker
   * @param jsonString The JSON string to beautify
   * @param space The number of spaces to use for indentation
   * @returns An Observable that emits the beautified JSON string
   */
  beautifyJson(jsonString: string, space: number = 2): Observable<string> {
    return from(this.runInWorker('beautifyJson', { jsonString, space }));
  }

  /**
   * Minifies a JSON string in a Web Worker
   * @param jsonString The JSON string to minify
   * @returns An Observable that emits the minified JSON string
   */
  minifyJson(jsonString: string): Observable<string> {
    return from(this.runInWorker('minifyJson', jsonString));
  }

  /**
   * Compares two JSON strings in a Web Worker
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns An Observable that emits the comparison result
   */
  compareJson(leftJsonString: string, rightJsonString: string): Observable<any> {
    return from(this.runInWorker('compareJson', { leftJsonString, rightJsonString }));
  }

  /**
   * Converts JSON to YAML in a Web Worker
   * @param jsonString The JSON string to convert
   * @returns An Observable that emits the YAML string
   */
  jsonToYaml(jsonString: string): Observable<string> {
    return from(this.runInWorker('jsonToYaml', jsonString));
  }

  /**
   * Converts JSON to XML in a Web Worker
   * @param jsonString The JSON string to convert
   * @returns An Observable that emits the XML string
   */
  jsonToXml(jsonString: string): Observable<string> {
    return from(this.runInWorker('jsonToXml', jsonString));
  }

  /**
   * Converts JSON to CSV in a Web Worker
   * @param jsonString The JSON string to convert
   * @returns An Observable that emits the CSV string
   */
  jsonToCsv(jsonString: string): Observable<string> {
    return from(this.runInWorker('jsonToCsv', jsonString));
  }

  /**
   * Validates a JSON string in a Web Worker
   * @param jsonString The JSON string to validate
   * @returns An Observable that emits the validation result
   */
  validateJson(jsonString: string): Observable<{ isValid: boolean, errorMessage: string }> {
    return from(this.runInWorker('validateJson', jsonString));
  }

  /**
   * Executes a JSONPath query in a Web Worker
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath expression
   * @returns An Observable that emits the query result
   */
  queryJsonPath(jsonString: string, jsonPath: string): Observable<any> {
    return from(this.runInWorker('queryJsonPath', { jsonString, jsonPath }));
  }

  /**
   * Runs a task in a Web Worker
   * @param taskName The name of the task to run
   * @param data The data to pass to the worker
   * @returns A Promise that resolves with the result
   */
  private runInWorker<T>(taskName: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      // Create a blob with the worker code
      const workerCode = this.getWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      // Start loading indicator
      this.loadingService.startLoading(`Processing ${taskName}...`, taskName);
      
      // Handle worker messages
      worker.onmessage = (e) => {
        URL.revokeObjectURL(workerUrl);
        worker.terminate();
        this.loadingService.stopLoading();
        
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.result);
        }
      };
      
      // Handle worker errors
      worker.onerror = (error) => {
        URL.revokeObjectURL(workerUrl);
        worker.terminate();
        this.loadingService.stopLoading();
        reject(error);
      };
      
      // Send the task to the worker
      worker.postMessage({
        task: taskName,
        data: data
      });
      
      // Set up progress reporting
      const progressCallback = this.loadingService.createProgressCallback(taskName);
      const progressInterval = setInterval(() => {
        worker.postMessage({ type: 'progress' });
      }, 100);
      
      // Clean up interval when worker is done
      const cleanupInterval = () => {
        clearInterval(progressInterval);
      };
      
      worker.addEventListener('message', (e) => {
        if (e.data.type === 'progress') {
          progressCallback(e.data.progress);
        }
        if (e.data.result || e.data.error) {
          cleanupInterval();
        }
      });
    });
  }

  /**
   * Gets the code for the Web Worker
   * @returns The worker code as a string
   */
  private getWorkerCode(): string {
    return `
      // Web Worker for JSON processing
      let progress = 0;
      
      self.onmessage = function(e) {
        try {
          // Handle progress requests
          if (e.data.type === 'progress') {
            self.postMessage({ type: 'progress', progress });
            return;
          }
          
          const { task, data } = e.data;
          let result;
          
          switch (task) {
            case 'parseJson':
              result = JSON.parse(data);
              break;
              
            case 'stringifyJson':
              result = JSON.stringify(data.jsonObject, null, data.space);
              break;
              
            case 'beautifyJson':
              const parsed = JSON.parse(data.jsonString);
              result = JSON.stringify(parsed, null, data.space);
              break;
              
            case 'minifyJson':
              const obj = JSON.parse(data);
              result = JSON.stringify(obj);
              break;
              
            case 'compareJson':
              result = compareJson(data.leftJsonString, data.rightJsonString);
              break;
              
            case 'jsonToYaml':
              result = convertJsonToYaml(data);
              break;
              
            case 'jsonToXml':
              result = convertJsonToXml(data);
              break;
              
            case 'jsonToCsv':
              result = convertJsonToCsv(data);
              break;
              
            case 'validateJson':
              result = validateJson(data);
              break;
              
            case 'queryJsonPath':
              result = queryJsonPath(data.jsonString, data.jsonPath);
              break;
              
            default:
              throw new Error('Unknown task: ' + task);
          }
          
          self.postMessage({ result });
        } catch (error) {
          self.postMessage({ 
            error: error.message || 'Unknown error in worker'
          });
        }
      };
      
      // Helper functions
      
      function compareJson(leftJsonString, rightJsonString) {
        const left = JSON.parse(leftJsonString);
        const right = JSON.parse(rightJsonString);
        
        // Simple comparison for worker demo
        // In a real app, use a proper diff library
        const differences = findDifferences(left, right);
        const hasDifferences = Object.keys(differences).length > 0;
        
        return {
          differences,
          hasDifferences,
          formattedDiff: JSON.stringify(differences, null, 2)
        };
      }
      
      function findDifferences(left, right, path = '') {
        const differences = {};
        
        // If types are different, return the whole objects
        if (typeof left !== typeof right) {
          differences[path || 'root'] = {
            left,
            right
          };
          return differences;
        }
        
        // If not objects, compare directly
        if (typeof left !== 'object' || left === null || right === null) {
          if (left !== right) {
            differences[path || 'root'] = {
              left,
              right
            };
          }
          return differences;
        }
        
        // Handle arrays
        if (Array.isArray(left) && Array.isArray(right)) {
          if (left.length !== right.length) {
            differences[path + '.length'] = {
              left: left.length,
              right: right.length
            };
          }
          
          const maxLength = Math.max(left.length, right.length);
          for (let i = 0; i < maxLength; i++) {
            const itemPath = path ? path + '[' + i + ']' : '[' + i + ']';
            if (i >= left.length) {
              differences[itemPath] = {
                left: undefined,
                right: right[i]
              };
            } else if (i >= right.length) {
              differences[itemPath] = {
                left: left[i],
                right: undefined
              };
            } else {
              const itemDiffs = findDifferences(left[i], right[i], itemPath);
              Object.assign(differences, itemDiffs);
            }
          }
          return differences;
        }
        
        // Handle objects
        const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
        for (const key of allKeys) {
          const keyPath = path ? path + '.' + key : key;
          if (!(key in left)) {
            differences[keyPath] = {
              left: undefined,
              right: right[key]
            };
          } else if (!(key in right)) {
            differences[keyPath] = {
              left: left[key],
              right: undefined
            };
          } else {
            const valueDiffs = findDifferences(left[key], right[key], keyPath);
            Object.assign(differences, valueDiffs);
          }
        }
        
        return differences;
      }
      
      function convertJsonToYaml(jsonString) {
        // Simple YAML conversion for worker demo
        // In a real app, use a proper YAML library
        const obj = JSON.parse(jsonString);
        return convertToYaml(obj);
      }
      
      function convertToYaml(obj, indent = 0) {
        const spaces = ' '.repeat(indent);
        let yaml = '';
        
        if (obj === null) {
          return spaces + 'null\\n';
        }
        
        if (typeof obj !== 'object') {
          if (typeof obj === 'string') {
            // Quote strings with special characters
            if (obj.match(/[:\\{\\}\\[\\],&*#?|\\-<>=!%@\\s]/)) {
              return spaces + '"' + obj.replace(/"/g, '\\\\"') + '"\\n';
            }
            return spaces + obj + '\\n';
          }
          return spaces + String(obj) + '\\n';
        }
        
        if (Array.isArray(obj)) {
          if (obj.length === 0) {
            return spaces + '[]\\n';
          }
          
          for (const item of obj) {
            yaml += spaces + '-' + (typeof item === 'object' && item !== null ? '\\n' + convertToYaml(item, indent + 2) : ' ' + convertToYaml(item, 0).trim() + '\\n');
          }
          return yaml;
        }
        
        const keys = Object.keys(obj);
        if (keys.length === 0) {
          return spaces + '{}\\n';
        }
        
        for (const key of keys) {
          const value = obj[key];
          if (typeof value === 'object' && value !== null) {
            yaml += spaces + key + ':\\n' + convertToYaml(value, indent + 2);
          } else {
            yaml += spaces + key + ': ' + convertToYaml(value, 0).trim() + '\\n';
          }
        }
        
        return yaml;
      }
      
      function convertJsonToXml(jsonString) {
        // Simple XML conversion for worker demo
        // In a real app, use a proper XML library
        const obj = JSON.parse(jsonString);
        return '<?xml version="1.0" encoding="UTF-8"?>\\n' + convertToXml(obj, 'root');
      }
      
      function convertToXml(obj, tagName) {
        if (obj === null) {
          return '<' + tagName + ' null="true"/>';
        }
        
        if (typeof obj !== 'object') {
          return '<' + tagName + '>' + String(obj) + '</' + tagName + '>';
        }
        
        let xml = '<' + tagName + '>';
        
        if (Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            xml += convertToXml(obj[i], 'item');
          }
        } else {
          for (const key in obj) {
            xml += convertToXml(obj[key], key);
          }
        }
        
        xml += '</' + tagName + '>';
        return xml;
      }
      
      function convertJsonToCsv(jsonString) {
        // Simple CSV conversion for worker demo
        // In a real app, use a proper CSV library
        const obj = JSON.parse(jsonString);
        
        if (!Array.isArray(obj)) {
          throw new Error('JSON must be an array of objects to convert to CSV');
        }
        
        if (obj.length === 0) {
          return '';
        }
        
        // Get all unique headers
        const headers = new Set();
        for (const item of obj) {
          if (typeof item === 'object' && item !== null) {
            for (const key in item) {
              headers.add(key);
            }
          }
        }
        
        const headerArray = Array.from(headers);
        let csv = headerArray.join(',') + '\\n';
        
        // Add data rows
        for (const item of obj) {
          const row = headerArray.map(header => {
            const value = item[header];
            if (value === undefined || value === null) {
              return '';
            }
            if (typeof value === 'string') {
              // Escape quotes and wrap in quotes
              return '"' + value.replace(/"/g, '""') + '"';
            }
            if (typeof value === 'object') {
              return '"' + JSON.stringify(value).replace(/"/g, '""') + '"';
            }
            return String(value);
          });
          
          csv += row.join(',') + '\\n';
        }
        
        return csv;
      }
      
      function validateJson(jsonString) {
        try {
          JSON.parse(jsonString);
          return { isValid: true, errorMessage: '' };
        } catch (error) {
          return { isValid: false, errorMessage: error.message };
        }
      }
      
      function queryJsonPath(jsonString, jsonPath) {
        // Simple JSONPath implementation for worker demo
        // In a real app, use a proper JSONPath library
        const obj = JSON.parse(jsonString);
        
        // Only support simple dot notation and array indices for demo
        const parts = jsonPath.split(/\\.\\[|\\]\\.|\\.|\\[|\\]/g).filter(Boolean);
        let current = obj;
        
        for (const part of parts) {
          if (current === undefined || current === null) {
            return null;
          }
          
          if (!isNaN(Number(part))) {
            current = current[Number(part)];
          } else {
            current = current[part];
          }
        }
        
        return current;
      }
      
      // Update progress periodically
      setInterval(() => {
        progress = Math.min(progress + 5, 95); // Never reach 100% automatically
      }, 200);
    `;
  }
}