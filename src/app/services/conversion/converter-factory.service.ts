import {Injectable} from '@angular/core';
import {JsonToYamlConverter, YamlToJsonConverter} from './converters/yaml-converter';
import {JsonToCsvConverter} from './converters/csv-converter';
import {JsonToXmlConverter, XmlToJsonConverter} from './converters/xml-converter';
import {Json5ToJsonConverter} from './converters/json5-converter';
import {
  IConverter,
  IFormatToJsonConverter,
  IJsonToFormatConverter
} from '../../interfaces/converters/converter.interface';

/**
 * Enum for supported conversion types
 */
export enum ConversionType {
  JSON_TO_YAML = 'json-to-yaml',
  YAML_TO_JSON = 'yaml-to-json',
  JSON_TO_CSV = 'json-to-csv',
  JSON_TO_XML = 'json-to-xml',
  XML_TO_JSON = 'xml-to-json',
  JSON5_TO_JSON = 'json5-to-json'
}

/**
 * Factory service for creating converters
 * Implements the Factory pattern to create appropriate converter instances
 */
@Injectable({
  providedIn: 'root'
})
export class ConverterFactoryService {
  constructor(
    private jsonToYamlConverter: JsonToYamlConverter,
    private yamlToJsonConverter: YamlToJsonConverter,
    private jsonToCsvConverter: JsonToCsvConverter,
    private jsonToXmlConverter: JsonToXmlConverter,
    private xmlToJsonConverter: XmlToJsonConverter,
    private json5ToJsonConverter: Json5ToJsonConverter
  ) {}

  /**
   * Creates a converter based on the conversion type
   * @param type The conversion type
   * @returns The appropriate converter
   */
  createConverter(type: ConversionType): IConverter<any, any> {
    switch (type) {
      case ConversionType.JSON_TO_YAML:
        return this.jsonToYamlConverter;
      case ConversionType.YAML_TO_JSON:
        return this.yamlToJsonConverter;
      case ConversionType.JSON_TO_CSV:
        return this.jsonToCsvConverter;
      case ConversionType.JSON_TO_XML:
        return this.jsonToXmlConverter;
      case ConversionType.XML_TO_JSON:
        return this.xmlToJsonConverter;
      case ConversionType.JSON5_TO_JSON:
        return this.json5ToJsonConverter;
      default:
        throw new Error(`Unsupported conversion type: ${type}`);
    }
  }

  /**
   * Creates a JSON to format converter
   * @param type The conversion type
   * @returns The appropriate JSON to format converter
   */
  createJsonToFormatConverter(type: ConversionType): IJsonToFormatConverter<string> {
    const converter = this.createConverter(type);
    if (this.isJsonToFormatConverter(converter)) {
      return converter;
    }
    throw new Error(`Converter for type ${type} is not a JSON to format converter`);
  }

  /**
   * Creates a format to JSON converter
   * @param type The conversion type
   * @returns The appropriate format to JSON converter
   */
  createFormatToJsonConverter(type: ConversionType): IFormatToJsonConverter<string> {
    const converter = this.createConverter(type);
    if (this.isFormatToJsonConverter(converter)) {
      return converter;
    }
    throw new Error(`Converter for type ${type} is not a format to JSON converter`);
  }

  /**
   * Type guard for JSON to format converters
   */
  private isJsonToFormatConverter(converter: IConverter<any, any>): converter is IJsonToFormatConverter<string> {
    return (
      converter === this.jsonToYamlConverter ||
      converter === this.jsonToCsvConverter ||
      converter === this.jsonToXmlConverter
    );
  }

  /**
   * Type guard for format to JSON converters
   */
  private isFormatToJsonConverter(converter: IConverter<any, any>): converter is IFormatToJsonConverter<string> {
    return (
      converter === this.yamlToJsonConverter ||
      converter === this.xmlToJsonConverter ||
      converter === this.json5ToJsonConverter
    );
  }
}