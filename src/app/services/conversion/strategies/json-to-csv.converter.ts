import { Injectable } from '@angular/core';
import { BaseConverter } from '../base/base-converter';

/**
 * Converter for JSON to CSV conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
  providedIn: 'root'
})
export class JsonToCsvConverter extends BaseConverter {
  /**
   * Converts JSON string to CSV string
   * @param jsonString The JSON string to convert
   * @returns Promise resolving to the CSV string
   */
  async convert(jsonString: string): Promise<string> {
    return Promise.resolve(this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_ARRAY);
      
      // If it's not an array, wrap it in an array
      const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
      
      if (jsonArray.length === 0) {
        return this.DEFAULT_EMPTY_STRING;
      }

      // Handle different JSON structures
      if (typeof jsonArray[0] !== 'object' || jsonArray[0] === null) {
        // Simple array of primitives
        return jsonArray.map(item => this.escapeCsvValue(String(item))).join('\n');
      }

      // For array of objects, extract headers
      const headers = this.extractCsvHeaders(jsonArray);
      
      // Generate CSV content
      return this.generateCsvContent(jsonArray, headers);
    }, 'JSON to CSV'));
  }

  /**
   * Extracts CSV headers from an array of objects
   * @param jsonArray The array of objects
   * @returns Array of header strings
   */
  extractCsvHeaders(jsonArray: any[]): string[] {
    const headers = new Set<string>();
    
    // Collect all unique keys from all objects
    for (const item of jsonArray) {
      if (typeof item === 'object' && item !== null) {
        this.collectKeys(item, this.DEFAULT_EMPTY_STRING, headers);
      }
    }
    
    return Array.from(headers);
  }

  /**
   * Generates CSV content from JSON array and headers
   * @param jsonArray The JSON array
   * @param headers The CSV headers
   * @returns The CSV string
   */
  private generateCsvContent(jsonArray: any[], headers: string[]): string {
    if (headers.length === 0) {
      return this.DEFAULT_EMPTY_STRING;
    }
    
    // Create header row
    const headerRow = headers.map(header => this.escapeCsvValue(header)).join(',');
    
    // Create data rows
    const rows = jsonArray.map(item => {
      return headers.map(header => {
        const value = this.getNestedValue(item, header);
        return this.formatCsvValue(value);
      }).join(',');
    });
    
    // Combine header and data rows
    return [headerRow, ...rows].join('\n');
  }

  /**
   * Collects all keys from an object, including nested objects
   * @param obj The object to collect keys from
   * @param prefix The current key prefix
   * @param keys The set to store keys
   */
  private collectKeys(obj: any, prefix: string, keys: Set<string>): void {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively collect keys from nested objects
        this.collectKeys(value, newKey, keys);
      } else {
        // Add the key to the set
        keys.add(newKey);
      }
    }
  }

  /**
   * Gets a nested value from an object using a dot-notation path
   * @param obj The object to get the value from
   * @param path The path to the value
   * @returns The value at the path
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path) {
      return obj;
    }
    
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Formats a value for CSV output
   * @param value The value to format
   * @returns The formatted string
   */
  private formatCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return this.DEFAULT_EMPTY_STRING;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return this.escapeCsvValue(JSON.stringify(value));
      }
      return this.escapeCsvValue(JSON.stringify(value));
    }
    
    return this.escapeCsvValue(String(value));
  }

  /**
   * Escapes a value for CSV output
   * @param value The value to escape
   * @returns The escaped string
   */
  private escapeCsvValue(value: string): string {
    if (!value) {
      return this.DEFAULT_EMPTY_STRING;
    }
    
    // If the value contains commas, newlines, or quotes, wrap it in quotes and escape any quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }
}