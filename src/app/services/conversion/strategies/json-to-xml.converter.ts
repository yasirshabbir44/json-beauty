import {Injectable} from '@angular/core';
import {BaseConverter} from '../base/base-converter';
import {Builder} from 'xml2js';
import {ConverterConstants} from '../../../constants/converter.constants';

/**
 * Converter for JSON to XML conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
    providedIn: 'root'
})
export class JsonToXmlConverter extends BaseConverter {
    /**
     * Converts JSON string to XML string
     * @param jsonString The JSON string to convert
     * @returns The XML string
     */
    convert(jsonString: string): string {
        return this.handleConversionError(() => {
            const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);

            // Create a root element to wrap the JSON
            const rootObj = {[ConverterConstants.XML_ROOT_ELEMENT]: jsonObj};

            // Create a new XML builder with pretty formatting
            const builder = new Builder({
                renderOpts: {pretty: true, indent: this.getIndentString(1)},
                headless: ConverterConstants.XML_HEADLESS
            });

            // Convert the object to XML
            return builder.buildObject(rootObj);
        }, ConverterConstants.OP_JSON_TO_XML);
    }
}