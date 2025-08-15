import {Injectable} from '@angular/core';
import {IAsyncStringConverter, IStringConverter} from '../../../interfaces/converter.interface';

/**
 * Enum for supported conversion types
 * Makes it easy to add new conversion types in the future
 */
export enum ConversionType {
    JSON_TO_YAML = 'JSON_TO_YAML',
    YAML_TO_JSON = 'YAML_TO_JSON',
    JSON_TO_CSV = 'JSON_TO_CSV',
    JSON_TO_XML = 'JSON_TO_XML',
    XML_TO_JSON = 'XML_TO_JSON',
    JSON5_TO_JSON = 'JSON5_TO_JSON'
}

/**
 * Factory for creating converters
 * Follows the Factory Method pattern to create appropriate converter instances
 */
@Injectable({
    providedIn: 'root'
})
export class ConverterFactory {
    // Maps conversion types to converter instances
    private readonly stringConverters = new Map<ConversionType, IStringConverter>();
    private readonly asyncConverters = new Map<ConversionType, IAsyncStringConverter>();

    /**
     * Registers a string converter for a specific conversion type
     * @param type The conversion type
     * @param converter The converter instance
     */
    registerStringConverter(type: ConversionType, converter: IStringConverter): void {
        this.stringConverters.set(type, converter);
    }

    /**
     * Registers an async converter for a specific conversion type
     * @param type The conversion type
     * @param converter The converter instance
     */
    registerAsyncConverter(type: ConversionType, converter: IAsyncStringConverter): void {
        this.asyncConverters.set(type, converter);
    }

    /**
     * Gets a string converter for a specific conversion type
     * @param type The conversion type
     * @returns The converter instance
     * @throws Error if no converter is registered for the given type
     */
    getStringConverter(type: ConversionType): IStringConverter {
        const converter = this.stringConverters.get(type);
        if (!converter) {
            throw new Error(`No converter registered for type: ${type}`);
        }
        return converter;
    }

    /**
     * Gets an async converter for a specific conversion type
     * @param type The conversion type
     * @returns The converter instance
     * @throws Error if no converter is registered for the given type
     */
    getAsyncConverter(type: ConversionType): IAsyncStringConverter {
        const converter = this.asyncConverters.get(type);
        if (!converter) {
            throw new Error(`No async converter registered for type: ${type}`);
        }
        return converter;
    }

    /**
     * Checks if a converter is registered for a specific conversion type
     * @param type The conversion type
     * @returns True if a converter is registered
     */
    hasConverter(type: ConversionType): boolean {
        return this.stringConverters.has(type) || this.asyncConverters.has(type);
    }
}