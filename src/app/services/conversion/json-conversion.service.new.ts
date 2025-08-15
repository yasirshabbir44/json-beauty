import {Injectable} from '@angular/core';
import {IJsonConversionService} from '../../interfaces';
import {ConversionType, ConverterFactory} from './factory/converter-factory';
import {JsonToYamlConverter} from './strategies/json-to-yaml.converter';
import {YamlToJsonConverter} from './strategies/yaml-to-json.converter';
import {JsonToCsvConverter} from './strategies/json-to-csv.converter';
import {JsonToXmlConverter} from './strategies/json-to-xml.converter';
import {XmlToJsonConverter} from './strategies/xml-to-json.converter';
import {Json5ToJsonConverter} from './strategies/json5-to-json.converter';

/**
 * Service for JSON conversion operations
 * Uses Strategy and Factory patterns to delegate conversion operations to specialized converters
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService implements IJsonConversionService {
  constructor(
    private converterFactory: ConverterFactory,
    private jsonToYamlConverter: JsonToYamlConverter,
    private yamlToJsonConverter: YamlToJsonConverter,
    private jsonToCsvConverter: JsonToCsvConverter,
    private jsonToXmlConverter: JsonToXmlConverter,
    private xmlToJsonConverter: XmlToJsonConverter,
    private json5ToJsonConverter: Json5ToJsonConverter
  ) {
    // Register all converters with the factory
    this.registerConverters();
  }

  /**
   * Registers all converters with the factory
   */
  private registerConverters(): void {
    // Register synchronous converters
    this.converterFactory.registerStringConverter(
      ConversionType.JSON_TO_YAML, 
      this.jsonToYamlConverter
    );
    this.converterFactory.registerStringConverter(
      ConversionType.YAML_TO_JSON, 
      this.yamlToJsonConverter
    );
    this.converterFactory.registerStringConverter(
      ConversionType.JSON_TO_CSV, 
      this.jsonToCsvConverter
    );
    this.converterFactory.registerStringConverter(
      ConversionType.JSON_TO_XML, 
      this.jsonToXmlConverter
    );
    this.converterFactory.registerStringConverter(
      ConversionType.JSON5_TO_JSON, 
      this.json5ToJsonConverter
    );
    
    // Register asynchronous converters
    this.converterFactory.registerAsyncConverter(
      ConversionType.XML_TO_JSON, 
      this.xmlToJsonConverter
    );
  }

  /**
   * Converts JSON to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string
   */
  jsonToYaml(jsonString: string): string {
    return this.converterFactory
      .getStringConverter(ConversionType.JSON_TO_YAML)
      .convert(jsonString);
  }

  /**
   * Converts YAML to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  yamlToJson(yamlString: string): string {
    return this.converterFactory
      .getStringConverter(ConversionType.YAML_TO_JSON)
      .convert(yamlString);
  }

  /**
   * Converts a JSON object to YAML with specific formatting
   * @param obj The JSON object to convert
   * @param indent The indentation level
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
      .getStringConverter(ConversionType.JSON_TO_CSV)
      .convert(jsonString);
  }

  /**
   * Extracts CSV headers from a JSON array
   * @param jsonArray The JSON array
   * @returns Array of CSV headers
   */
  extractCsvHeaders(jsonArray: any[]): string[] {
    return this.jsonToCsvConverter.extractCsvHeaders(jsonArray);
  }

  /**
   * Parses a JSON5 string to a JavaScript object
   * @param json5String The JSON5 string to parse
   * @returns The parsed JavaScript object
   */
  parseJSON5(json5String: string): any {
    // Use the JSON5 to JSON converter to get a standard JSON string
    const jsonString = this.converterFactory
      .getStringConverter(ConversionType.JSON5_TO_JSON)
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
      .getStringConverter(ConversionType.JSON_TO_XML)
      .convert(jsonString);
  }

  /**
   * Converts XML to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string> {
    return this.converterFactory
      .getAsyncConverter(ConversionType.XML_TO_JSON)
      .convert(xmlString);
  }
}