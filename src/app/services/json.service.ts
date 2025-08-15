import {Injectable} from '@angular/core';
import {JsonValidationService} from './validation/json-validation.service';
import {JsonFormattingService} from './formatting/json-formatting.service';
import {JsonConversionService} from './conversion/json-conversion.service';
import {JsonSchemaService} from './schema/json-schema.service';
import {JsonComparisonService} from './comparison/json-comparison.service';
import {JsonPathService} from './path/json-path.service';

/**
 * Main JSON service that delegates to specialized services
 * This service acts as a facade for all JSON-related operations
 * It delegates to specialized services to follow the Single Responsibility Principle
 */
@Injectable({
  providedIn: 'root'
})
export class JsonService {
  constructor(
    private validationService: JsonValidationService,
    private formattingService: JsonFormattingService,
    private conversionService: JsonConversionService,
    private schemaService: JsonSchemaService,
    private comparisonService: JsonComparisonService,
    private pathService: JsonPathService
  ) {}

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string or a Promise resolving to the YAML string
   */
  jsonToYaml(jsonString: string): string | Promise<string> {
    return this.conversionService.jsonToYaml(jsonString);
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string or a Promise resolving to the JSON string
   */
  yamlToJson(yamlString: string): string | Promise<string> {
    return this.conversionService.yamlToJson(yamlString);
  }

  /**
   * Recursively converts a JSON object to YAML string
   * @param obj The object to convert
   * @param indent The current indentation level
   * @returns The YAML string
   */
  private convertToYaml(obj: any, indent: number = 0): string {
    return this.conversionService.convertToYaml(obj, indent);
  }

  /**
   * Finds all JSON paths in an object
   * @param obj The object to search
   * @returns Array of path strings
   */
  findJsonPaths(jsonString: string): string[] {
    return this.pathService.findJsonPaths(jsonString);
  }

  /**
   * Recursively collects all paths in an object
   * @param obj The object to search
   * @param currentPath The current path
   * @param paths Array to collect paths
   */
  private collectPaths(obj: any, currentPath: string, paths: string[]): void {
    this.pathService.collectPaths(obj, currentPath, paths);
  }

  /**
   * Validates a JSON string
   * @param jsonString The JSON string to validate
   * @returns An object with validation result and error message if any
   */
  validateJson(jsonString: string): { isValid: boolean; errorMessage: string } {
    const result = this.validationService.validateJson(jsonString);
    return {
      isValid: result.isValid,
      errorMessage: result.error || ''
    };
  }

  /**
   * Sets custom indentation settings
   * @param size The number of characters to use for indentation
   * @param char The character to use for indentation (space or tab)
   */
  setIndentation(size: number, char: ' ' | '\t'): void {
    this.formattingService.setIndentation(size, char);
  }

  /**
   * Enforces strict double quotes in JSON keys and string values
   * @param jsonString The JSON string to process
   * @returns The JSON string with strict double quotes
   */
  enforceStrictDoubleQuotes(jsonString: string): string {
    return this.formattingService.enforceStrictDoubleQuotes(jsonString);
  }

  /**
   * Fixes inconsistent indentation in arrays and objects
   * @param jsonString The JSON string to fix
   * @returns The JSON string with consistent indentation
   */
  fixInconsistentIndentation(jsonString: string): string {
    return this.formattingService.fixInconsistentIndentation(jsonString);
  }

  /**
   * Beautifies a JSON string
   * @param jsonString The JSON string to beautify
   * @returns The beautified JSON string
   */
  beautifyJson(jsonString: string): string {
    return this.formattingService.beautifyJson(jsonString);
  }

  /**
   * Minifies a JSON string
   * @param jsonString The JSON string to minify
   * @returns The minified JSON string
   */
  minifyJson(jsonString: string): string {
    return this.formattingService.minifyJson(jsonString);
  }

  /**
   * Lints a JSON string and sorts keys
   * @param jsonString The JSON string to lint
   * @returns The linted JSON string
   */
  lintJson(jsonString: string): string {
    const result = this.validationService.lintJson(jsonString);
    return result.fixedJson || jsonString;
  }

  /**
   * Sorts the keys of an object alphabetically
   * @param obj The object to sort
   * @returns A new object with sorted keys
   */
  private sortObjectKeys(obj: any): any {
    return this.formattingService.sortObjectKeys(obj);
  }

  /**
   * Get the context around the error position to help identify the issue
   * @param jsonString The JSON string
   * @param position The position of the error
   * @returns A string with the context around the error
   */
  private getErrorContext(jsonString: string, position: number): string {
    const result = this.validationService.getErrorContext(jsonString, position);
    return result.context;
  }

  /**
   * Validates JSON against a schema
   * @param jsonString The JSON string to validate
   * @param schemaString The JSON schema string
   * @returns An object with validation result and errors if any
   */
  validateJsonSchema(jsonString: string, schemaString: string): { isValid: boolean, errors?: any[] } {
    return this.schemaService.validateJsonSchema(jsonString, schemaString);
  }

  /**
   * Compare two JSON objects and return the differences
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns An object with the comparison result and HTML representation
   */
  compareJson(leftJsonString: string, rightJsonString: string): { 
    delta: any, 
    htmlDiff: string,
    hasChanges: boolean
  } {
    const result = this.comparisonService.compareJson(leftJsonString, rightJsonString);
    return {
      delta: result.differences,
      htmlDiff: result.formattedDiff || '',
      hasChanges: result.hasDifferences
    };
  }

  /**
   * Parses JSON5 (relaxed JSON) and converts it to standard JSON
   * @param json5String The JSON5 string to parse
   * @returns The parsed object as a standard JSON string
   */
  parseJSON5(json5String: string): string {
    const parsedObj = this.conversionService.parseJSON5(json5String);
    return JSON.stringify(parsedObj, null, 2);
  }

  /**
   * Validates a JSON5 string
   * @param json5String The JSON5 string to validate
   * @returns An object with validation result and error message if any
   */
  validateJSON5(json5String: string): { isValid: boolean; errorMessage: string } {
    const result = this.validationService.validateJSON5(json5String);
    return {
      isValid: result.isValid,
      errorMessage: result.error || ''
    };
  }

  /**
   * Converts JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns The CSV string or a Promise resolving to the CSV string
   */
  jsonToCsv(jsonString: string): string | Promise<string> {
    return this.conversionService.jsonToCsv(jsonString);
  }

  /**
   * Generates a JSON schema from a JSON document
   * @param jsonString The JSON string to generate a schema for
   * @returns The generated schema as a string
   */
  generateJsonSchema(jsonString: string): string {
    return this.schemaService.generateJsonSchema(jsonString);
  }

  /**
   * Queries a JSON document using JSONPath syntax
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath expression
   * @returns The query result as a string
   */
  queryJsonPath(jsonString: string, jsonPath: string): string {
    try {
      const result = this.pathService.queryJsonPath(jsonString, jsonPath);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return JSON.stringify(result.result, null, 2);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error querying JSON path: ${errorMessage}`);
    }
  }

  /**
   * Evaluates a JSONPath expression against an object
   * @param obj The object to query
   * @param path The JSONPath expression
   * @returns The query result
   */
  private evaluateJsonPath(obj: any, path: string): any {
    return this.pathService.evaluateJsonPath(obj, path);
  }

  /**
   * Converts JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string or a Promise resolving to the XML string
   */
  jsonToXml(jsonString: string): string | Promise<string> {
    return this.conversionService.jsonToXml(jsonString);
  }

  /**
   * Converts XML to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    return this.conversionService.xmlToJson(xmlString);
  }
}
