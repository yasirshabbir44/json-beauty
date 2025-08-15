import {Injectable} from '@angular/core';
import {BaseConverter} from '../base/base-converter';
import * as JSON5 from 'json5';
import {ConverterConstants} from '../../../constants/converter.constants';

/**
 * Converter for JSON5 to JSON conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
    providedIn: 'root'
})
export class Json5ToJsonConverter extends BaseConverter {
    /**
     * Converts JSON5 string to standard JSON string
     * @param json5String The JSON5 string to convert
     * @returns The JSON string
     */
    convert(json5String: string): string {
        return this.handleConversionError(() => {
            // Parse the JSON5 string to an object
            const obj = JSON5.parse(json5String || this.DEFAULT_EMPTY_OBJECT);

            // Convert the object to a formatted JSON string
            return JSON.stringify(obj, ConverterConstants.JSON_NULL_REPLACER, this.getIndentation());
        }, ConverterConstants.OP_JSON5_TO_JSON);
    }
}