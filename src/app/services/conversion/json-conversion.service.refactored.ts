import { Injectable } from '@angular/core';
import { IJsonConversionService } from '../../interfaces';
import * as yaml from 'js-yaml';
import * as JSON5 from 'json5';
// Import from xml2js (our shim will be used due to module resolution)
import { parseString, Builder } from 'xml2js';

/**
 * Type definitions for improved type safety
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface JsonPathResult {
  result: any;
  error?: string;
}

/**
 * Service for JSON conversion operations
 * Follows the Single Responsibility Principle by focusing only on conversion concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService implements IJsonConversionService {
  // Constants for repeated values
  private readonly DEFAULT_INDENT_SIZE = 2;
  private readonly DEFAULT_INDENT_CHAR = ' ';
  private readonly DEFAULT_EMPTY_OBJECT = '{}';
  private readonly DEFAULT_EMPTY_ARRAY = '[]';
  private readonly DEFAULT_EMPTY_STRING = '';
  private readonly XML_ROOT_ELEMENT = 'root';

  // Default indentation settings
  private indentSize = this.DEFAULT_INDENT_SIZE;
  private indentChar = this.DEFAULT_INDENT_CHAR;

  constructor() {}

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string
   */
  jsonToYaml(jsonString: string): string {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      return this.convertToYaml(jsonObj);
    }, 'JSON to YAML');
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  yamlToJson(yamlString: string): string {
    return this.handleConversionError(() => {
      // Parse YAML string to JavaScript object
      const obj = yaml.load(yamlString || this.DEFAULT_EMPTY_STRING);
      
      // Convert the object to a JSON string with proper indentation
      return JSON.stringify(obj, null, this.getIndentation());
    }, 'YAML to JSON');
  }

  /**
   * Recursively converts a JSON object to YAML string
   * @param obj The object to convert
   * @param indent The current indentation level
   * @returns The YAML string
   */
  convertToYaml(obj: any, indent: number = 0): string {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';

    // Handle primitive types
    if (this.isPrimitive(obj)) {
      return this.formatPrimitiveForYaml(obj);
    }

    const indentStr = this.getIndentString(indent);
    let yaml = this.DEFAULT_EMPTY_STRING;

    if (Array.isArray(obj)) {
      yaml = this.convertArrayToYaml(obj, indent, indentStr);
    } else if (typeof obj === 'object') {
      yaml = this.convertObjectToYaml(obj, indent, indentStr);
    }

    return yaml;
  }

  /**
   * Converts JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns The CSV string
   */
  jsonToCsv(jsonString: string): string {
    return this.handleConversionError(() => {
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
    }, 'JSON to CSV');
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
   * Parses a JSON5 string to a JavaScript object
   * @param json5String The JSON5 string to parse
   * @returns The parsed JavaScript object
   */
  parseJSON5(json5String: string): any {
    return this.handleConversionError(() => {
      // Parse the JSON5 string
      return JSON5.parse(json5String || this.DEFAULT_EMPTY_OBJECT);
    }, 'parsing JSON5');
  }

  /**
   * Converts JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string
   */
  jsonToXml(jsonString: string): string {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      
      // Create a root element to wrap the JSON
      const rootObj = { [this.XML_ROOT_ELEMENT]: jsonObj };
      
      // Create a new XML builder with pretty formatting
      const builder = new Builder({
        renderOpts: { pretty: true, indent: this.getIndentString(1) },
        headless: true
      });
      
      // Convert the object to XML
      return builder.buildObject(rootObj);
    }, 'JSON to XML');
  }

  /**
   * Converts XML to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      parseString(xmlString, { explicitArray: false }, (err: any, result: any) => {
        if (err) {
          reject(new Error(`Error converting XML to JSON: ${err.message}`));
          return;
        }
        
        try {
          // Extract the content from the root element if it exists
          const jsonObj = result[this.XML_ROOT_ELEMENT] || result;
          
          // Convert to formatted JSON string
          const jsonString = JSON.stringify(jsonObj, null, this.getIndentation());
          resolve(jsonString);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Error processing XML conversion result: ${errorMessage}`));
        }
      });
    });
  }

  /**
   * Checks if a value is a primitive type (string, number, boolean)
   * @param value The value to check
   * @returns True if the value is a primitive
   * @private
   */
  private isPrimitive(value: any): boolean {
    return typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
  }

  /**
   * Formats a primitive value for YAML output
   * @param value The primitive value to format
   * @returns The formatted string
   * @private
   */
  private formatPrimitiveForYaml(value: any): string {
    if (typeof value === 'string') {
      // Only quote strings if they contain special characters
      if (/[:#{}[\],&*!|<>=?%@`]/.test(value) || /^\s|\s$/.test(value) || value === '') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }

  /**
   * Converts an array to YAML format
   * @param array The array to convert
   * @param indent The current indentation level
   * @param indentStr The indentation string
   * @returns The YAML string
   * @private
   */
  private convertArrayToYaml(array: any[], indent: number, indentStr: string): string {
    if (array.length === 0) return this.DEFAULT_EMPTY_ARRAY;

    let yaml = this.DEFAULT_EMPTY_STRING;
    for (const item of array) {
      yaml += `${indentStr}- ${this.convertToYaml(item, indent + 2).trimLeft()}\n`;
    }
    return yaml;
  }

  /**
   * Converts an object to YAML format
   * @param obj The object to convert
   * @param indent The current indentation level
   * @param indentStr The indentation string
   * @returns The YAML string
   * @private
   */
  private convertObjectToYaml(obj: Record<string, any>, indent: number, indentStr: string): string {
    if (Object.keys(obj).length === 0) return this.DEFAULT_EMPTY_OBJECT;

    let yaml = this.DEFAULT_EMPTY_STRING;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (this.isComplexObject(value)) {
        yaml += `${indentStr}${key}:\n${this.convertToYaml(value, indent + 2)}`;
      } else if (Array.isArray(value)) {
        yaml += this.formatArrayPropertyForYaml(key, value, indentStr, indent);
      } else {
        yaml += `${indentStr}${key}: ${this.convertToYaml(value, indent + 2)}\n`;
      }
    }
    return yaml;
  }

  /**
   * Checks if a value is a complex object (non-null object with properties)
   * @param value The value to check
   * @returns True if the value is a complex object
   * @private
   */
  private isComplexObject(value: any): boolean {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) && 
           Object.keys(value).length > 0;
  }

  /**
   * Formats an array property for YAML output
   * @param key The property key
   * @param array The array value
   * @param indentStr The indentation string
   * @param indent The current indentation level
   * @returns The formatted YAML string
   * @private
   */
  private formatArrayPropertyForYaml(key: string, array: any[], indentStr: string, indent: number): string {
    let yaml = `${indentStr}${key}:\n`;
    if (array.length === 0) {
      yaml += `${indentStr}  ${this.DEFAULT_EMPTY_ARRAY}\n`;
    } else {
      for (const item of array) {
        yaml += `${indentStr}  - ${this.convertToYaml(item, indent + 4).trimLeft()}\n`;
      }
    }
    return yaml;
  }

  /**
   * Generates CSV content from a JSON array and headers
   * @param jsonArray The JSON array
   * @param headers The CSV headers
   * @returns The CSV string
   * @private
   */
  private generateCsvContent(jsonArray: any[], headers: string[]): string {
    const csvRows = [];
    
    // Add headers row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const item of jsonArray) {
      const row = headers.map(header => {
        const value = this.getNestedValue(item, header);
        return this.escapeCsvValue(this.formatCsvValue(value));
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Recursively collects all keys from an object
   * @param obj The object to collect keys from
   * @param prefix The current path prefix
   * @param keys Set to store the collected keys
   * @private
   */
  private collectKeys(obj: any, prefix: string, keys: Set<string>): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Recursively collect keys for nested objects
        this.collectKeys(obj[key], fullKey, keys);
      } else {
        // Add the key to the set
        keys.add(fullKey);
      }
    }
  }

  /**
   * Gets a nested value from an object using a dot-notation path
   * @param obj The object to get the value from
   * @param path The path to the value
   * @returns The value at the path
   * @private
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Formats a value for CSV output
   * @param value The value to format
   * @returns The formatted value as a string
   * @private
   */
  private formatCsvValue(value: any): string {
    if (value === undefined || value === null) {
      return this.DEFAULT_EMPTY_STRING;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  /**
   * Escapes a value for CSV format
   * @param value The value to escape
   * @returns The escaped value
   * @private
   */
  private escapeCsvValue(value: string): string {
    // If the value contains commas, newlines, or quotes, wrap it in quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      // Double up any quotes in the value
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Gets the current indentation string
   * @returns The indentation string
   * @private
   */
  private getIndentation(): string {
    return this.indentChar.repeat(this.indentSize);
  }

  /**
   * Gets an indentation string for a specific level
   * @param indent The indentation level
   * @returns The indentation string
   * @private
   */
  private getIndentString(indent: number): string {
    return this.indentChar.repeat(indent);
  }

  /**
   * Handles conversion errors consistently
   * @param conversionFn The conversion function to execute
   * @param operationName The name of the operation for error messages
   * @returns The result of the conversion function
   * @private
   */
  private handleConversionError<T>(conversionFn: () => T, operationName: string): T {
    try {
      return conversionFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting ${operationName}: ${errorMessage}`);
    }
  }
}