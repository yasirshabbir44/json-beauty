import {Injectable} from '@angular/core';
import {IJsonValidationService} from '../../interfaces';
import Ajv from 'ajv';
import * as JSON5 from 'json5';

/**
 * Service for JSON validation operations
 * Follows the Single Responsibility Principle by focusing only on validation concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonValidationService implements IJsonValidationService {
  private ajv = new Ajv({ allErrors: true });

  constructor() {}

  /**
   * Validates a JSON string
   * @param jsonString The JSON string to validate
   * @returns An object with validation result and error message if any
   */
  validateJson(jsonString: string): { isValid: boolean; error?: string; errorPosition?: number } {
    if (!jsonString) {
      return {
        isValid: false,
        error: 'JSON is empty. Please enter some JSON data.'
      };
    }

    try {
      JSON.parse(jsonString);
      return {
        isValid: true
      };
    } catch (e) {
      // Ensure e is an Error object with a message property
      if (!(e instanceof Error)) {
        return {
          isValid: false,
          error: String(e)
        };
      }

      // Extract position information if available
      let errorPosition: number | undefined;
      const positionMatch = e.message.match(/position (\d+)/);
      if (positionMatch && positionMatch[1]) {
        errorPosition = parseInt(positionMatch[1]);
      }

      // Enhance error message with more helpful information
      let enhancedMessage = e.message;

      // Add context information if position is available
      if (errorPosition !== undefined) {
        const errorContext = this.getErrorContext(jsonString, errorPosition);
        enhancedMessage = `${e.message}\n\nError near: ${errorContext.context}`;
      }

      // Add common error suggestions
      if (e.message.includes('Unexpected token')) {
        enhancedMessage += '\n\nCommon causes: missing comma, extra comma, or unquoted property name.';
      } else if (e.message.includes('Unexpected end of JSON')) {
        enhancedMessage += '\n\nCheck for missing closing brackets or braces.';
      }

      return {
        isValid: false,
        error: enhancedMessage,
        errorPosition
      };
    }
  }

  /**
   * Validates a JSON5 string
   * @param json5String The JSON5 string to validate
   * @returns An object with validation result and error message if any
   */
  validateJSON5(json5String: string): { isValid: boolean; error?: string; errorPosition?: number } {
    if (!json5String) {
      return {
        isValid: false,
        error: 'JSON5 is empty. Please enter some JSON5 data.'
      };
    }

    try {
      JSON5.parse(json5String);
      return {
        isValid: true
      };
    } catch (e) {
      // Ensure e is an Error object with a message property
      if (!(e instanceof Error)) {
        return {
          isValid: false,
          error: String(e)
        };
      }

      return {
        isValid: false,
        error: e.message
      };
    }
  }

  /**
   * Performs linting on a JSON string
   * @param jsonString The JSON string to lint
   * @returns Object containing lint results
   */
  lintJson(jsonString: string): { 
    isValid: boolean; 
    formattingIssues: string[]; 
    suggestions: string[];
    fixedJson?: string;
  } {
    const validation = this.validateJson(jsonString);
    if (!validation.isValid) {
      return {
        isValid: false,
        formattingIssues: [validation.error || 'Invalid JSON'],
        suggestions: ['Fix the JSON syntax errors before linting']
      };
    }

    const formattingIssues: string[] = [];
    const suggestions: string[] = [];

    // Check for common formatting issues
    if (jsonString.includes('\t')) {
      formattingIssues.push('Uses tabs for indentation');
      suggestions.push('Replace tabs with spaces for consistent indentation');
    }

    if (jsonString.includes('  \n') || jsonString.includes('\n ')) {
      formattingIssues.push('Contains trailing whitespace');
      suggestions.push('Remove trailing whitespace');
    }

    // Check for inconsistent indentation
    const indentationPattern = /\n( +)/g;
    const indentations = new Set<number>();
    let match;
    while ((match = indentationPattern.exec(jsonString)) !== null) {
      indentations.add(match[1].length);
    }
    
    if (indentations.size > 1) {
      formattingIssues.push('Inconsistent indentation');
      suggestions.push('Use consistent indentation throughout the document');
    }

    // Check for single quotes instead of double quotes
    if (jsonString.includes("'")) {
      formattingIssues.push('Contains single quotes');
      suggestions.push('Use double quotes for property names and string values');
    }

    try {
      // Parse and re-stringify to fix formatting
      const jsonObj = JSON.parse(jsonString);
      const fixedJson = JSON.stringify(jsonObj, null, 2);
      
      return {
        isValid: true,
        formattingIssues,
        suggestions,
        fixedJson: formattingIssues.length > 0 ? fixedJson : undefined
      };
    } catch (e) {
      return {
        isValid: false,
        formattingIssues: [e instanceof Error ? e.message : String(e)],
        suggestions: ['Fix the JSON syntax errors']
      };
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

  /**
   * Gets context around an error position in a JSON string
   * @param jsonString The JSON string
   * @param position The error position
   * @returns Context information around the error
   */
  getErrorContext(jsonString: string, position: number): { 
    line: number; 
    column: number; 
    context: string;
  } {
    // Calculate line and column
    const lines = jsonString.substring(0, position).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    // Get context around the error
    const start = Math.max(0, position - 10);
    const end = Math.min(jsonString.length, position + 10);
    let context = jsonString.substring(start, end);

    // Highlight the error position with a marker
    if (position >= start && position < end) {
      const relativePos = position - start;
      context = context.substring(0, relativePos) + '👉' + context.substring(relativePos);
    }

    return {
      line,
      column,
      context
    };
  }
}