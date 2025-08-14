import { Injectable } from '@angular/core';
import * as JSON5 from 'json5';
import { IFormatToJsonConverter } from '../../../interfaces/converters/converter.interface';

/**
 * Converter for JSON5 to JSON conversion
 * Implements the Strategy pattern for JSON5 to JSON conversion
 */
@Injectable()
export class Json5ToJsonConverter implements IFormatToJsonConverter<string> {
  // Constants
  private readonly DEFAULT_INDENT_SIZE = 2;
  private readonly DEFAULT_INDENT_CHAR = ' ';
  private readonly DEFAULT_EMPTY_OBJECT = '{}';

  /**
   * Converts JSON5 string to standard JSON format
   * @param json5String The JSON5 string to convert
   * @returns The JSON string
   */
  convert(json5String: string): string {
    try {
      // Parse the JSON5 string
      const parsedObj = JSON5.parse(json5String || this.DEFAULT_EMPTY_OBJECT);
      
      // Convert to formatted JSON string
      return JSON.stringify(parsedObj, null, this.getIndentation());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error parsing JSON5: ${errorMessage}`);
    }
  }

  /**
   * Gets the current indentation string
   * @returns The indentation string
   */
  private getIndentation(): string {
    return this.DEFAULT_INDENT_CHAR.repeat(this.DEFAULT_INDENT_SIZE);
  }
}