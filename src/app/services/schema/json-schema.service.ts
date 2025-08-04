import { Injectable } from '@angular/core';
import { IJsonSchemaService } from '../../interfaces';
import Ajv from 'ajv';
import * as generateSchemaLib from 'generate-schema';

/**
 * Service for JSON schema operations
 * Follows the Single Responsibility Principle by focusing only on schema concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonSchemaService implements IJsonSchemaService {
  private ajv = new Ajv({ allErrors: true });
  private generateSchema = generateSchemaLib.json;
  
  // Default indentation settings
  private indentSize = 2;
  private indentChar = ' ';

  constructor() {}

  /**
   * Generates a JSON schema from a JSON document
   * @param jsonString The JSON string to generate a schema for
   * @returns The generated schema as a string
   */
  generateJsonSchema(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || '{}');
      const schema = this.generateSchema(jsonObj);
      
      // Format the schema with proper indentation
      return JSON.stringify(schema, null, this.indentChar.repeat(this.indentSize));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error generating JSON schema: ${errorMessage}`);
    }
  }

  /**
   * Validates a JSON string against a JSON schema
   * @param jsonString The JSON string to validate
   * @param schemaString The JSON schema string
   * @returns Object containing validation result and any errors
   */
  validateJsonSchema(jsonString: string, schemaString: string): { 
    isValid: boolean; 
    errors?: any[]; 
  } {
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
}