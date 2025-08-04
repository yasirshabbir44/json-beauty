/**
 * Interface for JSON formatting services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to JSON formatting
 */
export interface IJsonFormattingService {
  /**
   * Beautifies a JSON string with proper indentation and formatting
   * @param jsonString The JSON string to beautify
   * @returns The beautified JSON string
   */
  beautifyJson(jsonString: string): string;

  /**
   * Minifies a JSON string by removing whitespace and unnecessary characters
   * @param jsonString The JSON string to minify
   * @returns The minified JSON string
   */
  minifyJson(jsonString: string): string;

  /**
   * Sets the indentation size and character for JSON formatting
   * @param size The indentation size
   * @param char The indentation character (space or tab)
   */
  setIndentation(size: number, char: string): void;

  /**
   * Enforces strict double quotes in a JSON string
   * @param jsonString The JSON string
   * @returns JSON string with strict double quotes
   */
  enforceStrictDoubleQuotes(jsonString: string): string;

  /**
   * Fixes inconsistent indentation in a JSON string
   * @param jsonString The JSON string
   * @returns JSON string with consistent indentation
   */
  fixInconsistentIndentation(jsonString: string): string;

  /**
   * Sorts the keys of a JSON object alphabetically
   * @param obj The JSON object to sort
   * @returns A new JSON object with sorted keys
   */
  sortObjectKeys(obj: any): any;
}