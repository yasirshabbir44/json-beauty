import {Injectable} from '@angular/core';
import {IJsonConversionService} from '../../interfaces';
import {ConversionType, ConverterFactoryService} from './converter-factory.service';

/**
 * Service for JSON conversion operations
 * Implements the Facade pattern to provide a simplified interface to the conversion subsystem
 * Uses Strategy pattern (via converters) and Factory pattern (via converterFactory)
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService implements IJsonConversionService {
  constructor(private converterFactory: ConverterFactoryService) {}

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string
   */
  jsonToYaml(jsonString: string): string {
    return this.converterFactory
      .createJsonToFormatConverter(ConversionType.JSON_TO_YAML)
      .convert(jsonString);
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  yamlToJson(yamlString: string): string {
    return this.converterFactory
      .createFormatToJsonConverter(ConversionType.YAML_TO_JSON)
      .convert(yamlString);
  }

  /**
   * Converts a JSON object to YAML with specific formatting
   * @param obj The JSON object to convert
   * @param indent The indentation level (ignored as handled by converter)
   * @returns The YAML string
   */
  convertToYaml(obj: any, indent?: number): string {
    // Convert the object to a JSON string first
    const jsonString = JSON.stringify(obj);
    
    // Then use the JSON to YAML converter
    return this.jsonToYaml(jsonString);
  }

  /**
   * Converts JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns The CSV string
   */
  jsonToCsv(jsonString: string): string {
    return this.converterFactory
      .createJsonToFormatConverter(ConversionType.JSON_TO_CSV)
      .convert(jsonString);
  }

  /**
   * Extracts CSV headers from a JSON array
   * @param jsonArray The JSON array
   * @returns Array of CSV headers
   */
  extractCsvHeaders(jsonArray: any[]): string[] {
    // Access the converter directly for this utility method
    const jsonToCsvConverter = this.converterFactory
      .createConverter(ConversionType.JSON_TO_CSV) as any;
    
    return jsonToCsvConverter.extractCsvHeaders(jsonArray);
  }

  /**
   * Parses a JSON5 string to a JavaScript object
   * @param json5String The JSON5 string to parse
   * @returns The parsed JavaScript object
   */
  parseJSON5(json5String: string): any {
    // Use the JSON5 to JSON converter to get a standard JSON string
    const jsonString = this.converterFactory
      .createFormatToJsonConverter(ConversionType.JSON5_TO_JSON)
      .convert(json5String);
    
    // Parse the JSON string to get the object
    return JSON.parse(jsonString);
  }

  /**
   * Converts JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string
   */
  jsonToXml(jsonString: string): string {
    return this.converterFactory
      .createJsonToFormatConverter(ConversionType.JSON_TO_XML)
      .convert(jsonString);
  }

  /**
   * Converts XML to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    // This is an async converter, but we need to handle it specially
    const xmlToJsonConverter = this.converterFactory
      .createConverter(ConversionType.XML_TO_JSON) as any;
    
    return xmlToJsonConverter.convert(xmlString);
  }
}