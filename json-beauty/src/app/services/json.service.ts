import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class JsonService {
  constructor() {}

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