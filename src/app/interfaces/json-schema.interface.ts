/**
 * Interface for JSON schema services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to JSON schema operations
 */
export interface IJsonSchemaService {
  /**
   * Generates a JSON schema from a JSON string
   * @param jsonString The JSON string to generate a schema for
   * @returns The generated JSON schema as a string
   */
  generateJsonSchema(jsonString: string): string;

  /**
   * Validates a JSON string against a JSON schema
   * @param jsonString The JSON string to validate
   * @param schemaString The JSON schema string
   * @returns Object containing validation result and any errors
   */
  validateJsonSchema(jsonString: string, schemaString: string): { 
    isValid: boolean; 
    errors?: any[]; 
  };
}