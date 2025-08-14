// This is a simple test script to verify the refactored JSON conversion service
// It can be run with Node.js to test the basic functionality

// Import required modules
const yaml = require('js-yaml');
const JSON5 = require('json5');
const { parseString, Builder } = require('xml2js');

// Test data
const testJson = {
  name: "JSON Beauty",
  version: 1.0,
  features: ["YAML conversion", "CSV conversion", "XML conversion", "JSON5 parsing"],
  settings: {
    theme: "dark",
    indentation: 2
  }
};

// Test JSON to YAML conversion
function testJsonToYaml() {
  console.log("Testing JSON to YAML conversion:");
  const jsonString = JSON.stringify(testJson, null, 2);
  const yamlString = yaml.dump(testJson);
  console.log("Input JSON:", jsonString);
  console.log("Output YAML:", yamlString);
  console.log("Conversion successful!");
  console.log("-----------------------------------");
}

// Test YAML to JSON conversion
function testYamlToJson() {
  console.log("Testing YAML to JSON conversion:");
  const yamlString = yaml.dump(testJson);
  const parsedObj = yaml.load(yamlString);
  const jsonString = JSON.stringify(parsedObj, null, 2);
  console.log("Input YAML:", yamlString);
  console.log("Output JSON:", jsonString);
  console.log("Conversion successful!");
  console.log("-----------------------------------");
}

// Test JSON to CSV conversion
function testJsonToCsv() {
  console.log("Testing JSON to CSV conversion:");
  const jsonArray = [
    { id: 1, name: "Item 1", price: 10.99 },
    { id: 2, name: "Item 2", price: 20.50 },
    { id: 3, name: "Item 3", price: 5.75 }
  ];
  const jsonString = JSON.stringify(jsonArray, null, 2);
  
  // Extract headers
  const headers = Object.keys(jsonArray[0]);
  
  // Generate CSV
  const csvRows = [
    headers.join(','),
    ...jsonArray.map(row => headers.map(field => {
      const value = row[field];
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    }).join(','))
  ];
  const csvString = csvRows.join('\n');
  
  console.log("Input JSON:", jsonString);
  console.log("Output CSV:", csvString);
  console.log("Conversion successful!");
  console.log("-----------------------------------");
}

// Test JSON5 parsing
function testJson5Parsing() {
  console.log("Testing JSON5 parsing:");
  const json5String = `{
    // This is a JSON5 comment
    name: "JSON Beauty",
    version: 1.0,
    features: [
      "YAML conversion",
      "CSV conversion",
      "XML conversion",
      "JSON5 parsing",
    ],
    settings: {
      theme: "dark",
      indentation: 2,
    },
  }`;
  
  const parsedObj = JSON5.parse(json5String);
  const jsonString = JSON.stringify(parsedObj, null, 2);
  
  console.log("Input JSON5:", json5String);
  console.log("Output JSON:", jsonString);
  console.log("Parsing successful!");
  console.log("-----------------------------------");
}

// Test JSON to XML conversion
function testJsonToXml() {
  console.log("Testing JSON to XML conversion:");
  const jsonString = JSON.stringify(testJson, null, 2);
  
  // Create a root element to wrap the JSON
  const rootObj = { root: testJson };
  
  // Create a new XML builder with pretty formatting
  const builder = new Builder({
    renderOpts: { pretty: true, indent: '  ' },
    headless: true
  });
  
  // Convert the object to XML
  const xmlString = builder.buildObject(rootObj);
  
  console.log("Input JSON:", jsonString);
  console.log("Output XML:", xmlString);
  console.log("Conversion successful!");
  console.log("-----------------------------------");
}

// Test XML to JSON conversion
function testXmlToJson() {
  console.log("Testing XML to JSON conversion:");
  
  // Create a root element to wrap the JSON
  const rootObj = { root: testJson };
  
  // Create a new XML builder with pretty formatting
  const builder = new Builder({
    renderOpts: { pretty: true, indent: '  ' },
    headless: true
  });
  
  // Convert the object to XML
  const xmlString = builder.buildObject(rootObj);
  
  // Parse XML back to JSON
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
      console.error("Error converting XML to JSON:", err.message);
      return;
    }
    
    // Extract the content from the root element if it exists
    const jsonObj = result.root || result;
    
    // Convert to formatted JSON string
    const jsonString = JSON.stringify(jsonObj, null, 2);
    
    console.log("Input XML:", xmlString);
    console.log("Output JSON:", jsonString);
    console.log("Conversion successful!");
    console.log("-----------------------------------");
  });
}

// Run all tests
console.log("=== TESTING REFACTORED JSON CONVERSION SERVICE ===");
testJsonToYaml();
testYamlToJson();
testJsonToCsv();
testJson5Parsing();
testJsonToXml();
testXmlToJson();