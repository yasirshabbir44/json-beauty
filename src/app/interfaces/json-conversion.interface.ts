/**
 * Interface for JSON conversion services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to converting JSON to/from other formats
 */
export interface IJsonConversionService {
  /**
   * Converts a JSON string to YAML
   * @param jsonString The JSON string to convert
   * @returns The YAML string or a Promise resolving to the YAML string
   */
  jsonToYaml(jsonString: string): string | Promise<string>;

  /**
   * Converts a YAML string to JSON
   * @param yamlString The YAML string to convert
   * @returns The JSON string or a Promise resolving to the JSON string
   */
  yamlToJson(yamlString: string): string | Promise<string>;

  /**
   * Converts a JSON object to YAML with specific formatting
   * @param obj The JSON object to convert
   * @param indent The indentation level
   * @returns The YAML string
   */
  convertToYaml(obj: any, indent?: number): string;

  /**
   * Converts a JSON string to CSV format
   * @param jsonString The JSON string to convert
   * @returns The CSV string or a Promise resolving to the CSV string
   */
  jsonToCsv(jsonString: string): string | Promise<string>;

  /**
   * Extracts CSV headers from a JSON array
   * @param jsonArray The JSON array
   * @returns Array of CSV headers
   */
  extractCsvHeaders(jsonArray: any[]): string[];

  /**
   * Parses a JSON5 string to a JavaScript object
   * @param json5String The JSON5 string to parse
   * @returns The parsed JavaScript object or a Promise resolving to the parsed object
   */
  parseJSON5(json5String: string): any | Promise<any>;

  /**
   * Converts a JSON string to XML format
   * @param jsonString The JSON string to convert
   * @returns The XML string or a Promise resolving to the XML string
   */
  jsonToXml(jsonString: string): string | Promise<string>;

  /**
   * Converts an XML string to JSON format
   * @param xmlString The XML string to convert
   * @returns Promise resolving to the JSON string
   */
  xmlToJson(xmlString: string): Promise<string>;
}