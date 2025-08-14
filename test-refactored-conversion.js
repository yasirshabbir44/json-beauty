// Test script to verify the refactored JsonConversionService functionality
const yaml = require('js-yaml');
const JSON5 = require('json5');
const { parseString, Builder } = require('xml2js');

// Mock the Angular Injectable decorator
function Injectable(config) {
  return function(constructor) {
    return constructor;
  };
}

// Import the refactored service code (manually copied)
class JsonConversionService {
  // Constants for repeated values
  DEFAULT_INDENT_SIZE = 2;
  DEFAULT_INDENT_CHAR = ' ';
  DEFAULT_EMPTY_OBJECT = '{}';
  DEFAULT_EMPTY_ARRAY = '[]';
  DEFAULT_EMPTY_STRING = '';
  XML_ROOT_ELEMENT = 'root';

  // Default indentation settings
  indentSize = this.DEFAULT_INDENT_SIZE;
  indentChar = this.DEFAULT_INDENT_CHAR;

  constructor() {}

  // JSON to YAML conversion
  jsonToYaml(jsonString) {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      return this.convertToYaml(jsonObj);
    }, 'JSON to YAML');
  }

  // YAML to JSON conversion
  yamlToJson(yamlString) {
    return this.handleConversionError(() => {
      const obj = yaml.load(yamlString || this.DEFAULT_EMPTY_STRING);
      return JSON.stringify(obj, null, this.getIndentation());
    }, 'YAML to JSON');
  }

  // Convert object to YAML
  convertToYaml(obj, indent = 0) {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';

    if (this.isPrimitive(obj)) {
      return this.formatPrimitiveForYaml(obj);
    }

    const indentStr = this.getIndentString(indent);
    let yaml = this.DEFAULT_EMPTY_STRING;

    if (Array.isArray(obj)) {
      yaml = this.convertArrayToYaml(obj, indent, indentStr);
    } else if (typeof obj === 'object') {
      yaml = this.convertObjectToYaml(obj, indent, indentStr);
    }

    return yaml;
  }

  // JSON to CSV conversion
  jsonToCsv(jsonString) {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_ARRAY);
      const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
      
      if (jsonArray.length === 0) {
        return this.DEFAULT_EMPTY_STRING;
      }

      if (typeof jsonArray[0] !== 'object' || jsonArray[0] === null) {
        return jsonArray.map(item => this.escapeCsvValue(String(item))).join('\n');
      }

      const headers = this.extractCsvHeaders(jsonArray);
      return this.generateCsvContent(jsonArray, headers);
    }, 'JSON to CSV');
  }

  // Extract CSV headers
  extractCsvHeaders(jsonArray) {
    const headers = new Set();
    
    for (const item of jsonArray) {
      if (typeof item === 'object' && item !== null) {
        this.collectKeys(item, this.DEFAULT_EMPTY_STRING, headers);
      }
    }
    
    return Array.from(headers);
  }

  // Parse JSON5
  parseJSON5(json5String) {
    return this.handleConversionError(() => {
      return JSON5.parse(json5String || this.DEFAULT_EMPTY_OBJECT);
    }, 'parsing JSON5');
  }

  // JSON to XML conversion
  jsonToXml(jsonString) {
    return this.handleConversionError(() => {
      const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_OBJECT);
      const rootObj = { [this.XML_ROOT_ELEMENT]: jsonObj };
      
      const builder = new Builder({
        renderOpts: { pretty: true, indent: this.getIndentString(1) },
        headless: true
      });
      
      return builder.buildObject(rootObj);
    }, 'JSON to XML');
  }

  // XML to JSON conversion
  xmlToJson(xmlString) {
    return new Promise((resolve, reject) => {
      parseString(xmlString, { 
        explicitArray: false,
        explicitRoot: false,
        valueProcessors: [
          (value) => {
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
      }, (err, result) => {
        if (err) {
          reject(new Error(`Error converting XML to JSON: ${err.message}`));
          return;
        }
        
        try {
          const jsonObj = result[this.XML_ROOT_ELEMENT] || result;
          const jsonString = JSON.stringify(jsonObj, null, this.getIndentation());
          resolve(jsonString);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          reject(new Error(`Error processing XML conversion result: ${errorMessage}`));
        }
      });
    });
  }

  // Helper methods
  isPrimitive(value) {
    return typeof value === 'string' || 
           typeof value === 'number' || 
           typeof value === 'boolean';
  }

  formatPrimitiveForYaml(value) {
    if (typeof value === 'string') {
      if (/[:#{}[\],&*!|<>=?%@`]/.test(value) || /^\s|\s$/.test(value) || value === '') {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }
    return String(value);
  }

  convertArrayToYaml(array, indent, indentStr) {
    if (array.length === 0) return this.DEFAULT_EMPTY_ARRAY;

    let yaml = this.DEFAULT_EMPTY_STRING;
    for (const item of array) {
      yaml += `${indentStr}- ${this.convertToYaml(item, indent + 2).trimLeft()}\n`;
    }
    return yaml;
  }

  convertObjectToYaml(obj, indent, indentStr) {
    if (Object.keys(obj).length === 0) return this.DEFAULT_EMPTY_OBJECT;

    let yaml = this.DEFAULT_EMPTY_STRING;
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      
      if (this.isComplexObject(value)) {
        yaml += `${indentStr}${key}:\n${this.convertToYaml(value, indent + 2)}`;
      } else if (Array.isArray(value)) {
        yaml += this.formatArrayPropertyForYaml(key, value, indentStr, indent);
      } else {
        yaml += `${indentStr}${key}: ${this.convertToYaml(value, indent + 2)}\n`;
      }
    }
    return yaml;
  }

  isComplexObject(value) {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) && 
           Object.keys(value).length > 0;
  }

  formatArrayPropertyForYaml(key, array, indentStr, indent) {
    let yaml = `${indentStr}${key}:\n`;
    if (array.length === 0) {
      yaml += `${indentStr}  ${this.DEFAULT_EMPTY_ARRAY}\n`;
    } else {
      for (const item of array) {
        yaml += `${indentStr}  - ${this.convertToYaml(item, indent + 4).trimLeft()}\n`;
      }
    }
    return yaml;
  }

  generateCsvContent(jsonArray, headers) {
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    for (const item of jsonArray) {
      const row = headers.map(header => {
        const value = this.getNestedValue(item, header);
        return this.escapeCsvValue(this.formatCsvValue(value));
      });
      csvRows.push(row.join(','));
    }
    
    return csvRows.join('\n');
  }

  collectKeys(obj, prefix, keys) {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    for (const key of Object.keys(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        this.collectKeys(obj[key], fullKey, keys);
      } else {
        keys.add(fullKey);
      }
    }
  }

  getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  formatCsvValue(value) {
    if (value === undefined || value === null) {
      return this.DEFAULT_EMPTY_STRING;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }

  escapeCsvValue(value) {
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  getIndentation() {
    return this.indentChar.repeat(this.indentSize);
  }

  getIndentString(indent) {
    return this.indentChar.repeat(indent);
  }

  handleConversionError(conversionFn, operationName) {
    try {
      return conversionFn();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error converting ${operationName}: ${errorMessage}`);
    }
  }
}

// Test data
const testJson = {
  name: "JSON Beauty",
  version: "1.0.0",
  description: "A powerful JSON formatter and validator",
  features: [
    "Beautify JSON",
    "Minify JSON",
    "Validate JSON",
    "Convert to YAML"
  ],
  settings: {
    indentation: 2,
    theme: "dark"
  },
  isAwesome: true,
  numberOfUsers: 1000
};

// Create an instance of the service
const conversionService = new JsonConversionService();

// Test JSON to YAML conversion
console.log("=== Testing JSON to YAML conversion ===");
const jsonString = JSON.stringify(testJson, null, 2);
console.log("Original JSON:");
console.log(jsonString);

const yamlString = conversionService.jsonToYaml(jsonString);
console.log("\nConverted to YAML:");
console.log(yamlString);

// Test YAML to JSON conversion
console.log("\n=== Testing YAML to JSON conversion ===");
console.log("YAML input:");
console.log(yamlString);

const convertedJson = conversionService.yamlToJson(yamlString);
console.log("\nConverted back to JSON:");
console.log(convertedJson);

// Verify the round-trip conversion
const originalObj = JSON.parse(jsonString);
const convertedObj = JSON.parse(convertedJson);

console.log("\n=== Verification ===");
console.log("Round-trip conversion successful:", 
  JSON.stringify(originalObj) === JSON.stringify(convertedObj));

// Test JSON to CSV conversion
console.log("\n=== Testing JSON to CSV conversion ===");
const csvString = conversionService.jsonToCsv(jsonString);
console.log("CSV output:");
console.log(csvString);

// Test JSON5 parsing
console.log("\n=== Testing JSON5 parsing ===");
const json5String = `{
  // This is a comment
  name: 'JSON Beauty',
  version: '1.0.0',
  isAwesome: true,
}`;
console.log("JSON5 input:");
console.log(json5String);

const parsedJson5 = conversionService.parseJSON5(json5String);
console.log("\nParsed JSON5:");
console.log(parsedJson5);

// Test JSON to XML conversion
console.log("\n=== Testing JSON to XML conversion ===");
const xmlString = conversionService.jsonToXml(jsonString);
console.log("XML output:");
console.log(xmlString);

// Test XML to JSON conversion
console.log("\n=== Testing XML to JSON conversion ===");
conversionService.xmlToJson(xmlString)
  .then(xmlToJsonResult => {
    console.log("Converted XML back to JSON:");
    console.log(xmlToJsonResult);
    
    // Verify XML round-trip conversion
    const xmlRoundTripObj = JSON.parse(xmlToJsonResult);
    console.log("\nXML round-trip conversion successful:", 
      JSON.stringify(originalObj) === JSON.stringify(xmlRoundTripObj));
  })
  .catch(error => {
    console.error("Error in XML to JSON conversion:", error.message);
  });