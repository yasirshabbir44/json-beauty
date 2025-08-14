import { Injectable } from '@angular/core';
import { BaseConverter } from '../base/base-converter';
import * as yaml from 'js-yaml';

/**
 * Converter for JSON to YAML conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
  providedIn: 'root'
})
export class JsonToYamlConverter extends BaseConverter {
  /**
   * Converts JSON string to YAML string
   * @param jsonString The JSON string to convert
   * @returns Promise resolving to the YAML string
   */
  async convert(jsonString: string): Promise<string> {
    return Promise.resolve(this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      return this.convertToYaml(jsonObj);
    }, 'JSON to YAML'));
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

    // Handle primitive types
    if (this.isPrimitive(obj)) {
      return this.formatPrimitiveForYaml(obj);
    }

    const indentStr = this.getIndentString(indent);
    let yamlResult = this.DEFAULT_EMPTY_STRING;

    if (Array.isArray(obj)) {
      yamlResult = this.convertArrayToYaml(obj, indent, indentStr);
    } else if (typeof obj === 'object') {
      yamlResult = this.convertObjectToYaml(obj, indent, indentStr);
    }

    return yamlResult;
  }

  /**
   * Checks if a value is a primitive type (string, number, boolean)
   * @param value The value to check
   * @returns True if the value is a primitive
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
   */
  private convertArrayToYaml(array: any[], indent: number, indentStr: string): string {
    if (array.length === 0) return this.DEFAULT_EMPTY_ARRAY;

    let yamlResult = this.DEFAULT_EMPTY_STRING;
    for (const item of array) {
      yamlResult += `${indentStr}- ${this.convertToYaml(item, indent + 2).trimLeft()}\n`;
    }
    return yamlResult;
  }

  /**
   * Converts an object to YAML format
   * @param obj The object to convert
   * @param indent The current indentation level
   * @param indentStr The indentation string
   * @returns The YAML string
   */
  private convertObjectToYaml(obj: Record<string, any>, indent: number, indentStr: string): string {
    if (Object.keys(obj).length === 0) return this.DEFAULT_EMPTY_OBJECT;

    let yamlResult = this.DEFAULT_EMPTY_STRING;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (this.isComplexObject(value)) {
        yamlResult += `${indentStr}${key}:\n${this.convertToYaml(value, indent + 2)}`;
      } else if (Array.isArray(value)) {
        yamlResult += this.formatArrayPropertyForYaml(key, value, indentStr, indent);
      } else {
        yamlResult += `${indentStr}${key}: ${this.convertToYaml(value, indent + 2)}\n`;
      }
    }
    return yamlResult;
  }

  /**
   * Checks if a value is a complex object (non-null object with properties)
   * @param value The value to check
   * @returns True if the value is a complex object
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
   */
  private formatArrayPropertyForYaml(key: string, array: any[], indentStr: string, indent: number): string {
    if (array.length === 0) {
      return `${indentStr}${key}: ${this.DEFAULT_EMPTY_ARRAY}\n`;
    }

    let yamlResult = `${indentStr}${key}:\n`;
    const nestedIndentStr = this.getIndentString(indent + 2);
    
    for (const item of array) {
      yamlResult += `${nestedIndentStr}- ${this.convertToYaml(item, indent + 4).trimLeft()}\n`;
    }
    
    return yamlResult;
  }
}