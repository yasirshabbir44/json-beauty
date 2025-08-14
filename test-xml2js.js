// Simple test script to verify xml2js functionality
const xml2js = require('xml2js');

// Sample XML string
const xmlString = `
<root>
  <person>
    <name>John Doe</name>
    <age>30</age>
    <address>
      <street>123 Main St</street>
      <city>Anytown</city>
      <country>USA</country>
    </address>
    <hobbies>
      <hobby>Reading</hobby>
      <hobby>Hiking</hobby>
      <hobby>Coding</hobby>
    </hobbies>
  </person>
  <person>
    <name>Jane Smith</name>
    <age>25</age>
    <address>
      <street>456 Oak Ave</street>
      <city>Somewhere</city>
      <country>Canada</country>
    </address>
    <hobbies>
      <hobby>Painting</hobby>
      <hobby>Swimming</hobby>
    </hobbies>
  </person>
</root>
`;

// Parse XML to JSON
xml2js.parseString(xmlString, { explicitArray: false }, (err, result) => {
  if (err) {
    console.error('Error parsing XML:', err);
    return;
  }
  
  console.log('Parsed XML to JSON:');
  console.log(JSON.stringify(result, null, 2));
  
  // Convert back to XML
  const builder = new xml2js.Builder({ renderOpts: { pretty: true } });
  const xml = builder.buildObject(result);
  
  console.log('\nConverted back to XML:');
  console.log(xml);
  
  console.log('\nxml2js library is working correctly!');
});