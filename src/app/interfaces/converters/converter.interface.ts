/**
 * Base interface for all converters
 * Defines the contract that all specific converters must implement
 */
export interface IConverter<TInput, TOutput> {
  /**
   * Converts from input format to output format
   * @param input The input to convert
   * @returns The converted output
   */
  convert(input: TInput): TOutput | Promise<TOutput>;
}

/**
 * Interface for converters that convert from JSON string to another format
 */
export interface IJsonToFormatConverter<TOutput> extends IConverter<string, TOutput> {
  /**
   * Converts from JSON string to output format
   * @param jsonString The JSON string to convert
   * @returns The converted output
   */
  convert(jsonString: string): TOutput | Promise<TOutput>;
}

/**
 * Interface for converters that convert from another format to JSON string
 */
export interface IFormatToJsonConverter<TInput> extends IConverter<TInput, string> {
  /**
   * Converts from input format to JSON string
   * @param input The input to convert
   * @returns The JSON string
   */
  convert(input: TInput): string | Promise<string>;
}