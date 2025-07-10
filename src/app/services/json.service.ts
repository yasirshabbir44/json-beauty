import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JsonService {
  constructor() {}

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string
   */
  jsonToYaml(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      return this.convertToYaml(jsonObj);
    } catch (e) {
      throw new Error(`Error converting JSON to YAML: ${e}`);
    }
  }

  /**
   * Recursively converts a JSON object to YAML string
   * @param obj The object to convert
   * @param indent The current indentation level
   * @returns The YAML string
   */
  private convertToYaml(obj: any, indent: number = 0): string {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';

    // Handle different types
    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj.toString();

    const indentStr = ' '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';

      for (const item of obj) {
        yaml += `${indentStr}- ${this.convertToYaml(item, indent + 2).trimLeft()}\n`;
      }
    } else if (typeof obj === 'object') {
      if (Object.keys(obj).length === 0) return '{}';

      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
          yaml += `${indentStr}${key}:\n${this.convertToYaml(value, indent + 2)}`;
        } else if (Array.isArray(value)) {
          yaml += `${indentStr}${key}:\n`;
          if (value.length === 0) {
            yaml += `${indentStr}  []\n`;
          } else {
            for (const item of value) {
              yaml += `${indentStr}  - ${this.convertToYaml(item, indent + 4).trimLeft()}\n`;
            }
          }
        } else {
          yaml += `${indentStr}${key}: ${this.convertToYaml(value, indent + 2)}\n`;
        }
      }
    }

    return yaml;
  }

  /**
   * Finds all JSON paths in an object
   * @param obj The object to search
   * @returns Array of path strings
   */
  findJsonPaths(jsonString: string): string[] {
    try {
      const obj = JSON.parse(jsonString || '{}');
      const paths: string[] = [];
      this.collectPaths(obj, '$', paths);
      return paths;
    } catch (e) {
      throw new Error(`Error finding JSON paths: ${e}`);
    }
  }

  /**
   * Recursively collects all paths in an object
   * @param obj The object to search
   * @param currentPath The current path
   * @param paths Array to collect paths
   */
  private collectPaths(obj: any, currentPath: string, paths: string[]): void {
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
   * Validates a JSON string
   * @param jsonString The JSON string to validate
   * @returns An object with validation result and error message if any
   */
  validateJson(jsonString: string): { isValid: boolean; errorMessage: string } {
    if (!jsonString) {
      return {
        isValid: false,
        errorMessage: 'JSON is empty. Please enter some JSON data.'
      };
    }

    try {
      JSON.parse(jsonString);
      return {
        isValid: true,
        errorMessage: ''
      };
    } catch (e: any) {
      // Enhance error message with more helpful information
      let enhancedMessage = e.message;

      // Extract position information if available
      const positionMatch = e.message.match(/position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        const position = parseInt(positionMatch[1]);
        const errorContext = this.getErrorContext(jsonString, position);
        enhancedMessage = `${e.message}\n\nError near: ${errorContext}`;
      }

      // Add common error suggestions
      if (e.message.includes('Unexpected token')) {
        enhancedMessage += '\n\nCommon causes: missing comma, extra comma, or unquoted property name.';
      } else if (e.message.includes('Unexpected end of JSON')) {
        enhancedMessage += '\n\nCheck for missing closing brackets or braces.';
      }

      return {
        isValid: false,
        errorMessage: enhancedMessage
      };
    }
  }

  /**
   * Beautifies a JSON string
   * @param jsonString The JSON string to beautify
   * @returns The beautified JSON string
   */
  beautifyJson(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      return JSON.stringify(jsonObj, null, 2);
    } catch (e) {
      throw new Error(`Error beautifying JSON: ${e}`);
    }
  }

  /**
   * Minifies a JSON string
   * @param jsonString The JSON string to minify
   * @returns The minified JSON string
   */
  minifyJson(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      return JSON.stringify(jsonObj);
    } catch (e) {
      throw new Error(`Error minifying JSON: ${e}`);
    }
  }

  /**
   * Lints a JSON string and sorts keys
   * @param jsonString The JSON string to lint
   * @returns The linted JSON string
   */
  lintJson(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      const sortedObj = this.sortObjectKeys(jsonObj);
      return JSON.stringify(sortedObj, null, 2);
    } catch (e) {
      throw new Error(`Error linting JSON: ${e}`);
    }
  }

  /**
   * Sorts the keys of an object alphabetically
   * @param obj The object to sort
   * @returns A new object with sorted keys
   */
  private sortObjectKeys(obj: any): any {
    // If not an object or is null, return as is
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
      return obj;
    }

    // Create a new object with sorted keys
    const sortedObj: any = {};
    Object.keys(obj).sort().forEach(key => {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    });

    return sortedObj;
  }

  /**
   * Get the context around the error position to help identify the issue
   * @param jsonString The JSON string
   * @param position The position of the error
   * @returns A string with the context around the error
   */
  private getErrorContext(jsonString: string, position: number): string {
    const start = Math.max(0, position - 10);
    const end = Math.min(jsonString.length, position + 10);
    let context = jsonString.substring(start, end);

    // Highlight the error position with a marker
    if (position >= start && position < end) {
      const relativePos = position - start;
      context = context.substring(0, relativePos) + '👉' + context.substring(relativePos);
    }

    return context;
  }
}
