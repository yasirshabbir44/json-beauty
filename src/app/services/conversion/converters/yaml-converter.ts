import {Injectable} from '@angular/core';
import * as yaml from 'js-yaml';
import {IFormatToJsonConverter, IJsonToFormatConverter} from '../../../interfaces/converters/converter.interface';

/**
 * Base class for YAML converters with common functionality
 */
abstract class BaseYamlConverter {
  // Constants
  protected readonly DEFAULT_INDENT_SIZE = 2;
  protected readonly DEFAULT_INDENT_CHAR = ' ';
  protected readonly DEFAULT_EMPTY_OBJECT = '{}';
  protected readonly DEFAULT_EMPTY_STRING = '';

  /**
   * Gets the current indentation string
   * @returns The indentation string
   */
  protected getIndentation(): string {
    return this.DEFAULT_INDENT_CHAR.repeat(this.DEFAULT_INDENT_SIZE);
  }

  /**
   * Gets an indentation string for a specific level
   * @param indent The indentation level
   * @returns The indentation string
   */
  protected getIndentString(indent: number): string {
    return this.DEFAULT_INDENT_CHAR.repeat(indent);
  }

  /**
   * Handles conversion errors consistently
   * @param conversionFn The conversion function to execute
   * @param operationName The name of the operation for error messages
   * @returns The result of the conversion function
   */
  protected handleConversionError<T>(conversionFn: () => T, operationName: string): T {
    try {
      return conversionFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting ${operationName}: ${errorMessage}`);
    }
  }
}

/**
 * Converter for JSON to YAML conversion
 * Implements the Strategy pattern for JSON to YAML conversion
 */
@Injectable()
export class JsonToYamlConverter extends BaseYamlConverter implements IJsonToFormatConverter<string> {
  /**
   * Converts JSON string to YAML format
   * @param jsonString The JSON string to convert
   * @returns The YAML string
   */
  convert(jsonString: string): string {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      return this.convertToYaml(jsonObj);
    }, 'JSON to YAML');
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
    if (array.length === 0) return '[]';

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
   */
  private convertObjectToYaml(obj: Record<string, any>, indent: number, indentStr: string): string {
    if (Object.keys(obj).length === 0) return '{}';

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
    let yaml = `${indentStr}${key}:\n`;
    if (array.length === 0) {
      yaml += `${indentStr}  []\n`;
    } else {
      for (const item of array) {
        yaml += `${indentStr}  - ${this.convertToYaml(item, indent + 4).trimLeft()}\n`;
      }
    }
    return yaml;
  }
}

/**
 * Converter for YAML to JSON conversion
 * Implements the Strategy pattern for YAML to JSON conversion
 */
@Injectable()
export class YamlToJsonConverter extends BaseYamlConverter implements IFormatToJsonConverter<string> {
  /**
   * Converts YAML string to JSON format
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  convert(yamlString: string): string {
    return this.handleConversionError(() => {
      // Parse YAML string to JavaScript object
      const obj = yaml.load(yamlString || this.DEFAULT_EMPTY_STRING);
      
      // Convert the object to a JSON string with proper indentation
      return JSON.stringify(obj, null, this.getIndentation());
    }, 'YAML to JSON');
  }
}