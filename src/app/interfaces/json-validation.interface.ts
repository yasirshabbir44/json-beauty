/**
 * Interface for JSON validation services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to JSON validation
 */
export interface IJsonValidationService {
    /**
     * Validates a JSON string and returns validation result
     * @param jsonString The JSON string to validate
     * @returns Object containing validation result and any errors
     */
    validateJson(jsonString: string): { isValid: boolean; error?: string; errorPosition?: number };

    /**
     * Validates a JSON5 string and returns validation result
     * @param json5String The JSON5 string to validate
     * @returns Object containing validation result and any errors
     */
    validateJSON5(json5String: string): { isValid: boolean; error?: string; errorPosition?: number };

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
    };

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
    };
}