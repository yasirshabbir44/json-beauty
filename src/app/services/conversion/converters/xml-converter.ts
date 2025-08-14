import { Injectable } from '@angular/core';
import { IJsonToFormatConverter, IFormatToJsonConverter } from '../../../interfaces/converters/converter.interface';
import { parseString, Builder } from 'xml2js';

/**
 * Base class for XML converters with common functionality
 */
abstract class BaseXmlConverter {
  // Constants
  protected readonly DEFAULT_INDENT_SIZE = 2;
  protected readonly DEFAULT_INDENT_CHAR = ' ';
  protected readonly DEFAULT_EMPTY_OBJECT = '{}';
  protected readonly DEFAULT_EMPTY_STRING = '';
  protected readonly XML_ROOT_ELEMENT = 'root';

  /**
   * Gets the current indentation string
   * @returns The indentation string
   */
  protected getIndentation(): string {
    return this.DEFAULT_INDENT_CHAR.repeat(this.DEFAULT_INDENT_SIZE);
  }

  /**
   * Gets an indentation string for a specific level
   * @param indent The indentation level
   * @returns The indentation string
   */
  protected getIndentString(indent: number): string {
    return this.DEFAULT_INDENT_CHAR.repeat(indent);
  }
}

/**
 * Converter for JSON to XML conversion
 * Implements the Strategy pattern for JSON to XML conversion
 */
@Injectable()
export class JsonToXmlConverter extends BaseXmlConverter implements IJsonToFormatConverter<string> {
  /**
   * Converts JSON string to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string
   */
  convert(jsonString: string): string {
    try {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      
      // Create a root element to wrap the JSON
      const rootObj = { [this.XML_ROOT_ELEMENT]: jsonObj };
      
      // Create a new XML builder with pretty formatting
      const builder = new Builder({
        renderOpts: { pretty: true, indent: this.getIndentString(1) },
        headless: true
      });
      
      // Convert the object to XML
      return builder.buildObject(rootObj);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting JSON to XML: ${errorMessage}`);
    }
  }
}

/**
 * Converter for XML to JSON conversion
 * Implements the Strategy pattern for XML to JSON conversion
 */
@Injectable()
export class XmlToJsonConverter extends BaseXmlConverter implements IFormatToJsonConverter<string> {
  /**
   * Converts XML string to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  convert(xmlString: string): Promise<string> {
    return new Promise((resolve, reject) => {
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
  }
}