import { Injectable } from '@angular/core';
import { JsonParsingService } from './json-parsing.service';
import { JsonConversionService } from './json-conversion.service';
import { JsonAnalysisService } from './json-analysis.service';

/**
 * Facade service for JSON worker operations
 * Maintains backward compatibility with the original JsonWorkerService
 * Follows the Facade design pattern to simplify the interface to the subsystem
 * Delegates to specialized services following the Single Responsibility Principle
 */
@Injectable({
  providedIn: 'root'
})
export class JsonWorkerFacadeService {
  constructor(
    private jsonParsingService: JsonParsingService,
    private jsonConversionService: JsonConversionService,
    private jsonAnalysisService: JsonAnalysisService
  ) {}

  /**
   * Parse a JSON string into an object
   * @param jsonString The JSON string to parse
   * @returns Promise with the parsed JSON object
   */
  parseJson(jsonString: string): Promise<any> {
    return this.jsonParsingService.parseJson(jsonString);
  }

  /**
   * Convert a JSON object to a string
   * @param jsonObject The JSON object to stringify
   * @param space Number of spaces for indentation
   * @returns Promise with the JSON string
   */
  stringifyJson(jsonObject: any, space: number = 2): Promise<string> {
    return this.jsonParsingService.stringifyJson(jsonObject, space);
  }

  /**
   * Beautify a JSON string with proper formatting
   * @param jsonString The JSON string to beautify
   * @param space Number of spaces for indentation
   * @returns Promise with the beautified JSON string
   */
  beautifyJson(jsonString: string, space: number = 2): Promise<string> {
    return this.jsonParsingService.beautifyJson(jsonString, space);
  }

  /**
   * Minify a JSON string by removing whitespace
   * @param jsonString The JSON string to minify
   * @returns Promise with the minified JSON string
   */
  minifyJson(jsonString: string): Promise<string> {
    return this.jsonParsingService.minifyJson(jsonString);
  }

  /**
   * Compare two JSON strings
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns Promise with comparison result
   */
  compareJson(leftJsonString: string, rightJsonString: string): Promise<any> {
    return this.jsonAnalysisService.compareJson(leftJsonString, rightJsonString);
  }

  /**
   * Convert JSON to YAML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the YAML string
   */
  jsonToYaml(jsonString: string): Promise<string> {
    return this.jsonConversionService.jsonToYaml(jsonString);
  }

  /**
   * Convert JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the XML string
   */
  jsonToXml(jsonString: string): Promise<string> {
    return this.jsonConversionService.jsonToXml(jsonString);
  }

  /**
   * Convert JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns Promise with the CSV string
   */
  jsonToCsv(jsonString: string): Promise<string> {
    return this.jsonConversionService.jsonToCsv(jsonString);
  }

  /**
   * Validate a JSON string
   * @param jsonString The JSON string to validate
   * @returns Promise with validation result
   */
  validateJson(jsonString: string): Promise<{ valid: boolean; error?: string }> {
    return this.jsonParsingService.validateJson(jsonString);
  }

  /**
   * Query a JSON string using JSONPath
   * @param jsonString The JSON string to query
   * @param jsonPath The JSONPath query
   * @returns Promise with query results
   */
  queryJsonPath(jsonString: string, jsonPath: string): Promise<any> {
    return this.jsonAnalysisService.queryJsonPath(jsonString, jsonPath);
  }
}