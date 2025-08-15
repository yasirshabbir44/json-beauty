/**
 * Constants related to converters and data transformation
 */
export class ConverterConstants {
    // JSON-related constants
    static readonly JSON_NULL_REPLACER = null;
    
    // XML-related constants
    static readonly XML_ROOT_ELEMENT = 'root';
    static readonly XML_HEADLESS = true;
    
    // Operation names for error handling
    static readonly OP_JSON_TO_XML = 'JSON to XML';
    static readonly OP_JSON5_TO_JSON = 'JSON5 to JSON';
    static readonly OP_YAML_TO_JSON = 'YAML to JSON';
}