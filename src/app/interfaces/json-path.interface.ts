/**
 * Interface for JSON path services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to JSON path operations
 */
export interface IJsonPathService {
  /**
   * Finds all JSON paths in a JSON string
   * @param jsonString The JSON string to analyze
   * @returns Array of JSON paths
   */
  findJsonPaths(jsonString: string): string[];

  /**
   * Collects paths from a JSON object
   * @param obj The JSON object
   * @param currentPath The current path being processed
   * @param paths Array to store the collected paths
   */
  collectPaths(obj: any, currentPath: string, paths: string[]): void;

  /**
   * Queries a JSON string using a JSON path expression
   * @param jsonString The JSON string to query
   * @param jsonPath The JSON path expression
   * @returns The query result
   */
  queryJsonPath(jsonString: string, jsonPath: string): { 
    result: any; 
    error?: string;
  };

  /**
   * Evaluates a JSON path against a JSON object
   * @param obj The JSON object
   * @param path The JSON path
   * @returns The evaluation result
   */
  evaluateJsonPath(obj: any, path: string): any;
}