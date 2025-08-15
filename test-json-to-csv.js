// Simple test script for JSON to CSV conversion
const fs = require('fs');
const path = require('path');

// Test data
const testCases = [
  {
    name: 'Simple object',
    input: JSON.stringify({ name: 'John', age: 30, city: 'New York' }),
    expectedHeaders: ['name', 'age', 'city']
  },
  {
    name: 'Array of objects',
    input: JSON.stringify([
      { name: 'John', age: 30, city: 'New York' },
      { name: 'Jane', age: 25, city: 'Boston' }
    ]),
    expectedHeaders: ['name', 'age', 'city']
  },
  {
    name: 'Nested objects',
    input: JSON.stringify({
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        zip: '10001'
      }
    }),
    expectedHeaders: ['name', 'age', 'address.city', 'address.zip']
  },
  {
    name: 'Array of primitives',
    input: JSON.stringify([1, 2, 3, 4, 5]),
    expectedOutput: '1\n2\n3\n4\n5'
  },
  {
    name: 'Empty array',
    input: JSON.stringify([]),
    expectedOutput: ''
  },
  {
    name: 'Values with commas and quotes',
    input: JSON.stringify([
      { name: 'John, Jr.', description: 'He said "Hello"' },
      { name: 'Jane', description: 'She said "Hi"' }
    ]),
    expectedEscapedValues: ['"John, Jr."', '"He said ""Hello"""']
  }
];

// Function to manually test the CSV conversion logic
function testJsonToCsv() {
  console.log('Testing JSON to CSV conversion...');
  
  testCases.forEach(testCase => {
    console.log(`\nTest case: ${testCase.name}`);
    console.log(`Input: ${testCase.input}`);
    
    try {
      // Parse the JSON
      const jsonObj = JSON.parse(testCase.input || '[]');
      
      // Convert to CSV using similar logic to our converter
      const result = convertToCsv(jsonObj);
      console.log(`Output: ${result}`);
      
      // Verify the result
      if (testCase.expectedOutput) {
        console.log(`Expected output: ${testCase.expectedOutput}`);
        console.log(`Test ${result === testCase.expectedOutput ? 'PASSED' : 'FAILED'}`);
      } else if (testCase.expectedHeaders) {
        const headers = result.split('\n')[0].split(',');
        console.log(`Expected headers: ${testCase.expectedHeaders.join(',')}`);
        console.log(`Actual headers: ${headers.join(',')}`);
        const allHeadersPresent = testCase.expectedHeaders.every(h => headers.includes(h));
        console.log(`Test ${allHeadersPresent ? 'PASSED' : 'FAILED'}`);
      } else if (testCase.expectedEscapedValues) {
        const containsAllExpectedValues = testCase.expectedEscapedValues.every(v => 
          result.includes(v)
        );
        console.log(`Expected escaped values: ${testCase.expectedEscapedValues.join(', ')}`);
        console.log(`Test ${containsAllExpectedValues ? 'PASSED' : 'FAILED'}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      console.log('Test FAILED');
    }
  });
}

// Simplified version of our converter logic
function convertToCsv(jsonObj) {
  // If it's not an array, wrap it in an array
  const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
  
  if (jsonArray.length === 0) {
    return '';
  }
  
  // Handle different JSON structures
  if (typeof jsonArray[0] !== 'object' || jsonArray[0] === null) {
    // Simple array of primitives
    return jsonArray.map(item => escapeCsvValue(String(item))).join('\n');
  }
  
  // Extract headers
  const headers = extractCsvHeaders(jsonArray);
  
  // Generate CSV content
  return generateCsvContent(jsonArray, headers);
}

function extractCsvHeaders(jsonArray) {
  const headers = new Set();
  
  // Collect all unique keys from all objects
  for (const item of jsonArray) {
    if (typeof item === 'object' && item !== null) {
      collectKeys(item, '', headers);
    }
  }
  
  return Array.from(headers);
}

function collectKeys(obj, prefix, keys) {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  // Process each key in the object
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    // Check if value is a non-array object that needs recursive processing
    const isNestedObject = value !== null && 
                          typeof value === 'object' && 
                          !Array.isArray(value);
    
    if (isNestedObject) {
      // Recursively process nested objects
      collectKeys(value, newKey, keys);
    } else {
      // Add leaf node key to the set
      keys.add(newKey);
    }
  });
}

function generateCsvContent(jsonArray, headers) {
  if (headers.length === 0) {
    return '';
  }
  
  // Create header row with escaped values
  const headerRow = headers
    .map(header => escapeCsvValue(header))
    .join(',');
  
  // Create data rows by mapping each item and header
  const dataRows = jsonArray.map(item => 
    headers
      .map(header => formatCsvValue(getNestedValue(item, header)))
      .join(',')
  );
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

function getNestedValue(obj, path) {
  // Return the object itself if no path is provided
  if (!path) {
    return obj;
  }
  
  // Use reduce to navigate through the object path
  return path.split('.').reduce((current, part) => {
    // Return undefined if we can't navigate further
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    return current[part];
  }, obj);
}

function formatCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // Handle both arrays and objects with a single line
    return escapeCsvValue(JSON.stringify(value));
  }
  
  return escapeCsvValue(String(value));
}

function escapeCsvValue(value) {
  // Handle empty values
  if (!value) {
    return '';
  }
  
  // Check if value needs escaping (contains commas, newlines, or quotes)
  const needsEscaping = value.includes(',') || 
                       value.includes('\n') || 
                       value.includes('"');
  
  // If escaping is needed, wrap in quotes and double any existing quotes
  return needsEscaping 
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

// Run the tests
testJsonToCsv();