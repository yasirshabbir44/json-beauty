import { Injectable } from '@angular/core';
import { IJsonPathService } from '../../interfaces';

/**
 * Service for JSON path operations
 * Follows the Single Responsibility Principle by focusing only on path concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonPathService implements IJsonPathService {
  // Default indentation settings
  private indentSize = 2;
  private indentChar = ' ';

  constructor() {}

  /**
   * Finds all JSON paths in a JSON string
   * @param jsonString The JSON string to analyze
   * @returns Array of JSON paths
   */
  findJsonPaths(jsonString: string): string[] {
    try {
      const obj = JSON.parse(jsonString || '{}');
      const paths: string[] = [];
      this.collectPaths(obj, '$', paths);
      return paths;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error finding JSON paths: ${errorMessage}`);
    }
  }

  /**
   * Collects paths from a JSON object
   * @param obj The JSON object
   * @param currentPath The current path being processed
   * @param paths Array to store the collected paths
   */
  collectPaths(obj: any, currentPath: string, paths: string[]): void {
    if (obj === null || obj === undefined) {
      paths.push(currentPath);
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) {
        paths.push(`${currentPath}`);
      } else {
        for (let i = 0; i < obj.length; i++) {
          this.collectPaths(obj[i], `${currentPath}[${i}]`, paths);
        }
      }
    } else if (typeof obj === 'object') {
      if (Object.keys(obj).length === 0) {
        paths.push(`${currentPath}`);
      } else {
        for (const key of Object.keys(obj)) {
          const newPath = currentPath === '$' ? `${currentPath}.${key}` : `${currentPath}.${key}`;
          this.collectPaths(obj[key], newPath, paths);
        }
      }
    } else {
      paths.push(currentPath);
    }
  }

  /**
   * Queries a JSON string using a JSON path expression
   * @param jsonString The JSON string to query
   * @param jsonPath The JSON path expression
   * @returns The query result
   */
  queryJsonPath(jsonString: string, jsonPath: string): { 
    result: any; 
    error?: string;
  } {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      
      // Simple implementation of JSONPath query
      const result = this.evaluateJsonPath(jsonObj, jsonPath);
      
      return {
        result,
        error: undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        result: null,
        error: `Error querying JSON path: ${errorMessage}`
      };
    }
  }

  /**
   * Evaluates a JSON path against a JSON object
   * @param obj The JSON object
   * @param path The JSON path
   * @returns The evaluation result
   */
  evaluateJsonPath(obj: any, path: string): any {
    // Handle root object
    if (path === '$') {
      return obj;
    }
    
    // Remove the root symbol if present
    if (path.startsWith('$.')) {
      path = path.substring(2);
    } else if (path.startsWith('$')) {
      path = path.substring(1);
    }
    
    // Split the path into segments
    const segments = path.split('.');
    let current = obj;
    
    for (const segment of segments) {
      if (current === undefined || current === null) {
        return undefined;
      }
      
      // Handle array indices
      if (segment.includes('[') && segment.includes(']')) {
        const [name, indexPart] = segment.split('[');
        const index = parseInt(indexPart.replace(']', ''), 10);
        
        if (name) {
          current = current[name];
        }
        
        if (current === undefined || current === null || !Array.isArray(current)) {
          return undefined;
        }
        
        current = current[index];
      } else {
        current = current[segment];
      }
    }
    
    return current;
  }
}