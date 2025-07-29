// Simple test script to verify YAML to JSON and JSON to YAML conversion
const yaml = require('js-yaml');

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

// Convert JSON to YAML
function jsonToYaml(jsonObj) {
  try {
    return yaml.dump(jsonObj);
  } catch (e) {
    console.error(`Error converting JSON to YAML: ${e.message}`);
    return null;
  }
}

// Convert YAML to JSON
function yamlToJson(yamlString) {
  try {
    const obj = yaml.load(yamlString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    console.error(`Error converting YAML to JSON: ${e.message}`);
    return null;
  }
}

// Test JSON to YAML conversion
console.log("=== Testing JSON to YAML conversion ===");
const jsonString = JSON.stringify(testJson, null, 2);
console.log("Original JSON:");
console.log(jsonString);

const yamlString = jsonToYaml(testJson);
console.log("\nConverted to YAML:");
console.log(yamlString);

// Test YAML to JSON conversion
console.log("\n=== Testing YAML to JSON conversion ===");
console.log("YAML input:");
console.log(yamlString);

const convertedJson = yamlToJson(yamlString);
console.log("\nConverted back to JSON:");
console.log(convertedJson);

// Verify the round-trip conversion
const originalObj = JSON.parse(jsonString);
const convertedObj = JSON.parse(convertedJson);

console.log("\n=== Verification ===");
console.log("Round-trip conversion successful:", 
  JSON.stringify(originalObj) === JSON.stringify(convertedObj));