import { Injectable } from '@angular/core';
import Ajv from 'ajv';
import * as jsondiffpatch from 'jsondiffpatch';
import * as JSON5 from 'json5';
import * as yaml from 'js-yaml';
import * as generateSchemaLib from 'generate-schema';
const generateSchema = generateSchemaLib.json;

@Injectable({
  providedIn: 'root'
})
export class JsonService {
  private ajv = new Ajv({ allErrors: true });
  private diffPatcher = jsondiffpatch.create();

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
  private convertToYaml(obj: any, indent: number = 0): string {
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
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error finding JSON paths: ${errorMessage}`);
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
    } catch (e) {
      // Ensure e is an Error object with a message property
      if (!(e instanceof Error)) {
        return {
          isValid: false,
          errorMessage: String(e)
        };
      }

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
   * Sets custom indentation settings
   * @param size The number of characters to use for indentation
   * @param char The character to use for indentation (space or tab)
   */
  setIndentation(size: number, char: ' ' | '\t'): void {
    this.indentSize = size;
    this.indentChar = char;
  }

  /**
   * Enforces strict double quotes in JSON keys and string values
   * @param jsonString The JSON string to process
   * @returns The JSON string with strict double quotes
   */
  enforceStrictDoubleQuotes(jsonString: string): string {
    try {
      // First try to parse the JSON to see if it's valid standard JSON
      const jsonObj = JSON.parse(jsonString || '{}');

      // Use JSON.stringify to ensure all keys and string values use double quotes
      return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
    } catch (e) {
      // If standard JSON parsing fails, try using JSON5 parser
      // This handles single quotes, trailing commas, comments, etc.
      try {
        // Parse with JSON5 which is more lenient
        const jsonObj = JSON5.parse(jsonString || '{}');
        
        // Convert back to standard JSON with double quotes
        return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
      } catch (e) {
        // If JSON5 parsing also fails, it's likely not valid JSON at all
        const errorMessage = e instanceof Error ? e.message : String(e);
        throw new Error(`Error enforcing strict double quotes: ${errorMessage}`);
      }
    }
  }

  /**
   * Fixes inconsistent indentation in arrays and objects
   * @param jsonString The JSON string to fix
   * @returns The JSON string with consistent indentation
   */
  fixInconsistentIndentation(jsonString: string): string {
    try {
      // Parse the JSON to get the object structure
      const jsonObj = JSON.parse(jsonString || '{}');

      // Use JSON.stringify with a custom replacer to ensure consistent indentation
      return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error fixing indentation: ${errorMessage}`);
    }
  }

  /**
   * Beautifies a JSON string
   * @param jsonString The JSON string to beautify
   * @returns The beautified JSON string
   */
  beautifyJson(jsonString: string): string {
    try {
      // First enforce strict double quotes
      const strictJson = this.enforceStrictDoubleQuotes(jsonString);

      // Then fix inconsistent indentation
      return this.fixInconsistentIndentation(strictJson);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error beautifying JSON: ${errorMessage}`);
    }
  }

  /**
   * Minifies a JSON string
   * @param jsonString The JSON string to minify
   * @returns The minified JSON string
   */
  minifyJson(jsonString: string): string {
    try {
      // First enforce strict double quotes
      const strictJson = this.enforceStrictDoubleQuotes(jsonString);

      // Parse the JSON to get the object structure
      const jsonObj = JSON.parse(strictJson);

      // Use JSON.stringify without indentation to minify
      return JSON.stringify(jsonObj);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error minifying JSON: ${errorMessage}`);
    }
  }

  /**
   * Lints a JSON string and sorts keys
   * @param jsonString The JSON string to lint
   * @returns The linted JSON string
   */
  lintJson(jsonString: string): string {
    try {
      // First enforce strict double quotes
      const strictJson = this.enforceStrictDoubleQuotes(jsonString);

      // Parse the JSON to get the object structure
      const jsonObj = JSON.parse(strictJson);

      // Sort object keys
      const sortedObj = this.sortObjectKeys(jsonObj);

      // Use JSON.stringify with indentation to format
      return JSON.stringify(sortedObj, null, this.indentChar.repeat(this.indentSize));
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      throw new Error(`Error linting JSON: ${errorMessage}`);
    }
  }

  /**
   * Sorts the keys of an object alphabetically
   * @param obj The object to sort
   * @returns A new object with sorted keys
   */
  private sortObjectKeys(obj: any): any {
    // If null or not an object, return as is
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays - map each item and recursively sort if it's an object
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
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

  /**
   * Validates JSON against a schema
   * @param jsonString The JSON string to validate
   * @param schemaString The JSON schema string
   * @returns An object with validation result and errors if any
   */
  validateJsonSchema(jsonString: string, schemaString: string): { isValid: boolean, errors: any[] } {
    try {
      // Parse the JSON and schema
      const json = JSON.parse(jsonString);
      const schema = JSON.parse(schemaString);

      // Validate the JSON against the schema
      const validate = this.ajv.compile(schema);
      const isValid = validate(json);

      // Return the validation result
      return {
        isValid,
        errors: validate.errors || []
      };
    } catch (error) {
      // If there's an error parsing the JSON or schema, return an error
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isValid: false,
        errors: [{ message: errorMessage }]
      };
    }
  }

  /**
   * Compare two JSON objects and return the differences
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns An object with the comparison result and HTML representation
   */
  compareJson(leftJsonString: string, rightJsonString: string): { 
    delta: any, 
    htmlDiff: string,
    hasChanges: boolean
  } {
    try {
      // Parse the JSON strings
      const leftJson = JSON.parse(leftJsonString);
      const rightJson = JSON.parse(rightJsonString);

      // Calculate the delta between the two objects
      const delta = this.diffPatcher.diff(leftJson, rightJson);

      // Generate HTML visualization of the differences
      // Handle the case where delta might be undefined
      const htmlDiff = delta ? jsondiffpatch.formatters.html.format(delta, leftJson) : '';

      return {
        delta,
        htmlDiff,
        hasChanges: !!delta
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error comparing JSON: ${errorMessage}`);
    }
  }

  /**
   * Parses JSON5 (relaxed JSON) and converts it to standard JSON
   * @param json5String The JSON5 string to parse
   * @returns The parsed object as a standard JSON string
   */
  parseJSON5(json5String: string): string {
    try {
      // Parse the JSON5 string
      const parsedObj = JSON5.parse(json5String || '{}');

      // Convert back to standard JSON
      return JSON.stringify(parsedObj, null, this.indentChar.repeat(this.indentSize));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error parsing JSON5: ${errorMessage}`);
    }
  }

  /**
   * Validates a JSON5 string
   * @param json5String The JSON5 string to validate
   * @returns An object with validation result and error message if any
   */
  validateJSON5(json5String: string): { isValid: boolean; errorMessage: string } {
    if (!json5String) {
      return {
        isValid: false,
        errorMessage: 'JSON5 is empty. Please enter some JSON5 data.'
      };
    }

    try {
      JSON5.parse(json5String);
      return {
        isValid: true,
        errorMessage: ''
      };
    } catch (e) {
      // Ensure e is an Error object with a message property
      if (!(e instanceof Error)) {
        return {
          isValid: false,
          errorMessage: String(e)
        };
      }

      return {
        isValid: false,
        errorMessage: e.message
      };
    }
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
  private extractCsvHeaders(jsonArray: any[]): string[] {
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
   * Generates a JSON schema from a JSON document
   * @param jsonString The JSON string to generate a schema for
   * @returns The generated schema as a string
   */
  generateJsonSchema(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      const schema = generateSchema(jsonObj);
      
      // Format the schema with proper indentation
      return JSON.stringify(schema, null, this.indentChar.repeat(this.indentSize));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generating JSON schema: ${errorMessage}`);
    }
  }

  /**
   * Queries a JSON document using JSONPath syntax
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath expression
   * @returns The query result as a string
   */
  queryJsonPath(jsonString: string, jsonPath: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      
      // Simple implementation of JSONPath query
      // This is a basic implementation and could be enhanced with a full JSONPath library
      const result = this.evaluateJsonPath(jsonObj, jsonPath);
      
      return JSON.stringify(result, null, this.indentChar.repeat(this.indentSize));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error querying JSON path: ${errorMessage}`);
    }
  }

  /**
   * Evaluates a JSONPath expression against an object
   * @param obj The object to query
   * @param path The JSONPath expression
   * @returns The query result
   */
  private evaluateJsonPath(obj: any, path: string): any {
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
        
        if (Array.isArray(current) && !isNaN(index)) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current[segment];
      }
    }
    
    return current;
  }
}
