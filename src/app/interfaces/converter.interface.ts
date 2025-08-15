/**
 * Generic interface for all converters
 * Follows the Strategy Pattern by defining a common interface for all conversion strategies
 */
export interface IConverter<TInput, TOutput> {
    /**
     * Converts from input type to output type
     * @param input The input to convert
     * @returns The converted output
     */
    convert(input: TInput): TOutput;
}

/**
 * Interface for string-to-string converters
 * Specialization of IConverter for string conversions
 */
export interface IStringConverter extends IConverter<string, Promise<string>> {
    /**
     * Converts from one string format to another
     * @param input The input string to convert
     * @returns The converted string
     */
    convert(input: string): Promise<string>;
}

/**
 * Interface for async string-to-string converters
 * For conversions that require asynchronous processing
 */
export interface IAsyncStringConverter extends IConverter<string, Promise<string>> {
    /**
     * Converts from one string format to another asynchronously
     * @param input The input string to convert
     * @returns Promise resolving to the converted string
     */
    convert(input: string): Promise<string>;
}