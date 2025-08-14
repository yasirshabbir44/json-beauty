/**
 * Utility functions for common JSON operations
 */
import { ErrorResponse, createErrorResponse } from './error-handling.util';
import { JsonValue, JsonObject, JsonArray, JsonPrimitive, JsonValidationResult, JsonSchemaType } from '../types/json.types';

/**
 * Safely parses a JSON string
 * @param jsonString The JSON string to parse
 * @returns The parsed object or an error response
 */
export function safeJsonParse(jsonString: string): JsonValue | ErrorResponse {
  try {
    return JSON.parse(jsonString || '{}') as JsonValue;
  } catch (error) {
    return createErrorResponse(error, 'JSON parsing');
  }
}

/**
 * Safely stringifies a JSON object
 * @param obj The object to stringify
 * @param indent The indentation level (number of spaces)
 * @returns The JSON string or an error response
 */
export function safeJsonStringify(obj: JsonValue, indent: number = 2): string | ErrorResponse {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return createErrorResponse(error, 'JSON stringification');
  }
}

/**
 * Checks if a string is valid JSON
 * @param jsonString The string to check
 * @returns A validation result object
 */
export function isValidJson(jsonString: string): JsonValidationResult {
  try {
    if (!jsonString.trim()) {
      return { 
        valid: false, 
        message: 'Empty JSON string',
        errors: ['Empty JSON string']
      };
    }
    
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { 
      valid: false, 
      message: errorMessage,
      errors: [errorMessage]
    };
  }
}

/**
 * Formats a JSON string with proper indentation
 * @param jsonString The JSON string to format
 * @param indent The indentation level (number of spaces)
 * @returns The formatted JSON string or an error response
 */
export function formatJson(jsonString: string, indent: number = 2): string | ErrorResponse {
  try {
    const obj = JSON.parse(jsonString || '{}') as JsonValue;
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return createErrorResponse(error, 'JSON formatting');
  }
}

/**
 * Gets the type of a JSON value
 * @param value The value to check
 * @returns The type of the value as a string
 */
export function getJsonValueType(value: JsonValue): JsonSchemaType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  return typeof value as JsonSchemaType;
}

/**
 * Checks if a JSON object is empty
 * @param obj The object to check
 * @returns True if the object is empty
 */
export function isEmptyObject(obj: JsonObject): boolean {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length === 0;
}

/**
 * Checks if a JSON array is empty
 * @param arr The array to check
 * @returns True if the array is empty
 */
export function isEmptyArray(arr: JsonArray): boolean {
  return Array.isArray(arr) && arr.length === 0;
}