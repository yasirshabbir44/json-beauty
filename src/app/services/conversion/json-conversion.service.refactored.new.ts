import {Injectable} from '@angular/core';
import {IJsonConversionService} from '../../interfaces';
import {ConversionType, ConverterFactoryService} from './converter-factory.service';

/**
 * Service for JSON conversion operations
 * Implements the Facade pattern to provide a simplified interface to the conversion subsystem
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService implements IJsonConversionService {
  constructor(private converterFactory: ConverterFactoryService) {}

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string or a Promise resolving to the YAML string
   */
  jsonToYaml(jsonString: string): string | Promise<string> {
    const converter = this.converterFactory.createJsonToFormatConverter(ConversionType.JSON_TO_YAML);
    return converter.convert(jsonString);
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string or a Promise resolving to the JSON string
   */
  yamlToJson(yamlString: string): string | Promise<string> {
    const converter = this.converterFactory.createFormatToJsonConverter(ConversionType.YAML_TO_JSON);
    return converter.convert(yamlString);
  }

  /**
   * Converts a JSON object to YAML with specific formatting
   * @param obj The JSON object to convert
   * @param indent The indentation level
   * @returns The YAML string
   */
  convertToYaml(obj: any, indent?: number): string {
    // We can directly use the JsonToYamlConverter's convertToYaml method
    // This is a special case where we need to access a specific method of the converter
    const converter = this.converterFactory.createJsonToFormatConverter(ConversionType.JSON_TO_YAML) as any;
    return converter.convertToYaml(obj, indent);
  }

  /**
   * Converts a JSON string to CSV format
   * @param jsonString The JSON string to convert
   * @returns Promise resolving to the CSV string
   */
  jsonToCsv(jsonString: string): Promise<string> {
    const converter = this.converterFactory.createJsonToFormatConverter(ConversionType.JSON_TO_CSV);
    return converter.convert(jsonString);
  }

  /**
   * Extracts CSV headers from a JSON array
   * @param jsonArray The JSON array
   * @returns Array of CSV headers
   */
  extractCsvHeaders(jsonArray: any[]): string[] {
    // This is a special case where we need to access a specific method of the converter
    const converter = this.converterFactory.createJsonToFormatConverter(ConversionType.JSON_TO_CSV) as any;
    return converter.extractCsvHeaders(jsonArray);
  }

  /**
   * Parses a JSON5 string to a JavaScript object
   * @param json5String The JSON5 string to parse
   * @returns The parsed JavaScript object
   */
  parseJSON5(json5String: string): any {
    const converter = this.converterFactory.createFormatToJsonConverter(ConversionType.JSON5_TO_JSON);
    const jsonString = converter.convert(json5String);
    return JSON.parse(jsonString);
  }

  /**
   * Converts a JSON string to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string
   */
  jsonToXml(jsonString: string): string {
    const converter = this.converterFactory.createJsonToFormatConverter(ConversionType.JSON_TO_XML);
    return converter.convert(jsonString);
  }

  /**
   * Converts an XML string to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    const converter = this.converterFactory.createFormatToJsonConverter(ConversionType.XML_TO_JSON);
    return converter.convert(xmlString) as Promise<string>;
  }
}