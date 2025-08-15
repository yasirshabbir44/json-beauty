import {Injectable} from '@angular/core';
import {BaseAsyncConverter} from '../base/base-converter';
import {parseString} from 'xml2js';

/**
 * Converter for XML to JSON conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
    providedIn: 'root'
})
export class XmlToJsonConverter extends BaseAsyncConverter {
    // Root element name for XML
    private readonly XML_ROOT_ELEMENT = 'root';

    /**
     * Converts XML string to JSON string asynchronously
     * @param xmlString The XML string to convert
     * @returns Promise resolving to the JSON string
     */
    convert(xmlString: string): Promise<string> {
        return this.handleAsyncConversionError(async () => {
            return new Promise<string>((resolve, reject) => {
                parseString(xmlString, {
                    explicitArray: false,
                    explicitRoot: false,
                    valueProcessors: [
                        (value: string) => {
                            // Convert numeric strings to numbers
                            if (/^-?\d+$/.test(value)) {
                                return parseInt(value, 10);
                            } else if (/^-?\d+\.\d+$/.test(value)) {
                                return parseFloat(value);
                            } else if (value === 'true') {
                                return true;
                            } else if (value === 'false') {
                                return false;
                            }
                            return value;
                        }
                    ]
                }, (err: any, result: any) => {
                    if (err) {
                        reject(new Error(`Error converting XML to JSON: ${err.message}`));
                        return;
                    }

                    try {
                        // Extract the content from the root element if it exists
                        const jsonObj = result[this.XML_ROOT_ELEMENT] || result;

                        // Convert to formatted JSON string
                        const jsonString = JSON.stringify(jsonObj, null, this.getIndentation());
                        resolve(jsonString);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        reject(new Error(`Error processing XML conversion result: ${errorMessage}`));
                    }
                });
            });
        }, 'XML to JSON');
    }
}