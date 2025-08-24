/**
 * Interfaces for worker-related services
 * Following Interface Segregation Principle (ISP) by creating focused interfaces
 */

/**
 * Base interface for all worker services
 */
export interface IWorkerService {
  /**
   * Run a task in a web worker
   * @param taskName The name of the task to run
   * @param data The data to pass to the worker
   * @returns Promise with the result of the worker task
   */
  runInWorker<T, U>(taskName: string, data: T): Promise<U>;
}

/**
 * Interface for JSON parsing and formatting operations
 */
export interface IJsonParsingService {
  /**
   * Parse a JSON string into an object
   * @param jsonString The JSON string to parse
   * @returns Promise with the parsed JSON object
   */
  parseJson(jsonString: string): Promise<any>;
  
  /**
   * Convert a JSON object to a string
   * @param jsonObject The JSON object to stringify
   * @param space Number of spaces for indentation
   * @returns Promise with the JSON string
   */
  stringifyJson(jsonObject: any, space?: number): Promise<string>;
  
  /**
   * Beautify a JSON string with proper formatting
   * @param jsonString The JSON string to beautify
   * @param space Number of spaces for indentation
   * @returns Promise with the beautified JSON string
   */
  beautifyJson(jsonString: string, space?: number): Promise<string>;
  
  /**
   * Minify a JSON string by removing whitespace
   * @param jsonString The JSON string to minify
   * @returns Promise with the minified JSON string
   */
  minifyJson(jsonString: string): Promise<string>;
  
  /**
   * Validate a JSON string
   * @param jsonString The JSON string to validate
   * @returns Promise with validation result
   */
  validateJson(jsonString: string): Promise<{ valid: boolean; error?: string }>;
}

/**
 * Interface for JSON conversion operations
 */
export interface IJsonConversionService {
  /**
   * Convert JSON to YAML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the YAML string
   */
  jsonToYaml(jsonString: string): Promise<string>;
  
  /**
   * Convert JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the XML string
   */
  jsonToXml(jsonString: string): Promise<string>;
  
  /**
   * Convert JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns Promise with the CSV string
   */
  jsonToCsv(jsonString: string): Promise<string>;
}

/**
 * Interface for JSON analysis operations
 */
export interface IJsonAnalysisService {
  /**
   * Compare two JSON strings
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns Promise with comparison result
   */
  compareJson(leftJsonString: string, rightJsonString: string): Promise<any>;
  
  /**
   * Query a JSON string using JSONPath
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath query
   * @returns Promise with query results
   */
  queryJsonPath(jsonString: string, jsonPath: string): Promise<any>;
}