import { Injectable } from '@angular/core';
import { IJsonConversionService } from '../../interfaces';
import * as yaml from 'js-yaml';
import * as JSON5 from 'json5';
// Import from xml2js (our shim will be used due to module resolution)
import { parseString, Builder } from 'xml2js';

/**
 * Service for JSON conversion operations
 * Follows the Single Responsibility Principle by focusing only on conversion concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService implements IJsonConversionService {
  // Default indentation settings
  private indentSize = 2;
  private indentChar = ' ';

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
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error converting JSON to YAML: ${errorMessage}`);
    }
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  yamlToJson(yamlString: string): string {
    try {
      // Parse YAML string to JavaScript object
      const obj = yaml.load(yamlString || '');
      
      // Convert the object to a JSON string with proper indentation
      return JSON.stringify(obj, null, this.indentChar.repeat(this.indentSize));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error converting YAML to JSON: ${errorMessage}`);
    }
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

    // Handle different types
    if (typeof obj === 'string') {
      // Only quote strings if they contain special characters
      if (/[:#{}[\],&*!|<>=?%@`]/.test(obj) || /^\s|\s$/.test(obj) || obj === '') {
        return `"${obj.replace(/"/g, '\\"')}"`;
      }
      return obj;
    }
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
   * Converts JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns The CSV string
   */
  jsonToCsv(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '[]');
      
      // If it's not an array, wrap it in an array
      const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
      
      if (jsonArray.length === 0) {
        return '';
      }

      // Handle different JSON structures
      if (typeof jsonArray[0] !== 'object' || jsonArray[0] === null) {
        // Simple array of primitives
        return jsonArray.map(item => this.escapeCsvValue(String(item))).join('\n');
      }

      // For array of objects, extract headers
      const headers = this.extractCsvHeaders(jsonArray);
      
      // Generate CSV content
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting JSON to CSV: ${errorMessage}`);
    }
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
        this.collectKeys(item, '', headers);
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
    try {
      // Parse the JSON5 string
      return JSON5.parse(json5String || '{}');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error parsing JSON5: ${errorMessage}`);
    }
  }

  /**
   * Recursively collects all keys from an object
   * @param obj The object to collect keys from
   * @param prefix The current path prefix
   * @param keys Set to store the collected keys
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
   */
  private formatCsvValue(value: any): string {
    if (value === undefined || value === null) {
      return '';
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
   * Converts JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string
   */
  jsonToXml(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      
      // Create a root element to wrap the JSON
      const rootObj = { root: jsonObj };
      
      // Create a new XML builder with pretty formatting
      const builder = new Builder({
        renderOpts: { pretty: true, indent: '  ' },
        headless: true
      });
      
      // Convert the object to XML
      return builder.buildObject(rootObj);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting JSON to XML: ${errorMessage}`);
    }
  }

  /**
   * Converts XML to JSON format
   * @param xmlString The XML string to convert
   * @returns The JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      parseString(xmlString, { explicitArray: false }, (err:any, result:any) => {
        if (err) {
          reject(new Error(`Error converting XML to JSON: ${err.message}`));
          return;
        }
        
        try {
          // Extract the content from the root element if it exists
          const jsonObj = result.root || result;
          
          // Convert to formatted JSON string
          const jsonString = JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
          resolve(jsonString);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Error processing XML conversion result: ${errorMessage}`));
        }
      });
    });
  }
}