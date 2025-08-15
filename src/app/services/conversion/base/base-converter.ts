import {IStringConverter} from '../../../interfaces/converter.interface';

/**
 * Abstract base class for string converters
 * Provides common functionality and error handling for all converters
 */
export abstract class BaseConverter implements IStringConverter {
  // Constants for repeated values
  protected readonly DEFAULT_EMPTY_OBJECT = '{}';
  protected readonly DEFAULT_EMPTY_ARRAY = '[]';
  protected readonly DEFAULT_EMPTY_STRING = '';
  
  // Default indentation settings
  protected readonly DEFAULT_INDENT_SIZE = 2;
  protected readonly DEFAULT_INDENT_CHAR = ' ';
  
  /**
   * Abstract method to be implemented by concrete converters
   * @param input The input string to convert
   * @returns The converted string
   */
  abstract convert(input: string): Promise<string>;
  
  /**
   * Gets the indentation size
   * @returns The indentation size
   */
  protected getIndentation(): number {
    return this.DEFAULT_INDENT_SIZE;
  }
  
  /**
   * Gets the indentation string for a specific level
   * @param indent The indentation level
   * @returns The indentation string
   */
  protected getIndentString(indent: number): string {
    return this.DEFAULT_INDENT_CHAR.repeat(indent * this.getIndentation());
  }
  
  /**
   * Handles conversion errors in a consistent way
   * @param conversionFn The conversion function to execute
   * @param operationName The name of the operation for error reporting
   * @returns The result of the conversion or an error message
   */
  protected handleConversionError<T>(conversionFn: () => T, operationName: string): T {
    try {
      return conversionFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error during ${operationName} conversion: ${errorMessage}`);
      throw new Error(`Error during ${operationName} conversion: ${errorMessage}`);
    }
  }
}

/**
 * Abstract base class for asynchronous string converters
 * Extends BaseConverter with async support
 */
export abstract class BaseAsyncConverter extends BaseConverter {
  
  /**
   * Handles async conversion errors in a consistent way
   * @param conversionFn The async conversion function to execute
   * @param operationName The name of the operation for error reporting
   * @returns Promise resolving to the result of the conversion or rejecting with an error
   */
  protected async handleAsyncConversionError<T>(
    conversionFn: () => Promise<T>, 
    operationName: string
  ): Promise<T> {
    try {
      return await conversionFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error during ${operationName} conversion: ${errorMessage}`);
      throw new Error(`Error during ${operationName} conversion: ${errorMessage}`);
    }
  }
}