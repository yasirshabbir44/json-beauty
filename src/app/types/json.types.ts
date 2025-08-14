/**
 * Type definitions for JSON data structures
 */

/**
 * Represents any valid JSON value
 */
export type JsonValue = 
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

/**
 * Represents a JSON object
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Represents a JSON array
 */
export type JsonArray = JsonValue[];

/**
 * Represents a JSON primitive value
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Represents a JSON path segment
 */
export type JsonPathSegment = string | number;

/**
 * Represents a JSON path
 */
export type JsonPath = JsonPathSegment[];

/**
 * Represents a JSON schema type
 */
export type JsonSchemaType = 
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'object'
  | 'array'
  | 'null';

/**
 * Represents a JSON conversion result
 */
export interface JsonConversionResult<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Represents a JSON validation result
 */
export interface JsonValidationResult {
  valid: boolean;
  errors?: string[];
  message?: string;
}

/**
 * Represents a JSON comparison result
 */
export interface JsonComparisonResult {
  equal: boolean;
  differences?: {
    path: string;
    left: JsonValue;
    right: JsonValue;
  }[];
}

/**
 * Represents a JSON search result
 */
export interface JsonSearchResult {
  path: string;
  value: JsonValue;
  parent?: JsonObject | JsonArray;
}