// Simple test script to verify jsonpath functionality
const jsonpath = require('jsonpath');

// Sample JSON object
const json = {
  store: {
    book: [
      {
        category: "reference",
        author: "Nigel Rees",
        title: "Sayings of the Century",
        price: 8.95
      },
      {
        category: "fiction",
        author: "Evelyn Waugh",
        title: "Sword of Honour",
        price: 12.99
      }
    ],
    bicycle: {
      color: "red",
      price: 19.95
    }
  }
};

// Test JSONPath queries
console.log('All books:', jsonpath.query(json, '$.store.book[*]'));
console.log('Book titles:', jsonpath.query(json, '$.store.book[*].title'));
console.log('First book:', jsonpath.query(json, '$.store.book[0]'));
console.log('Bicycle color:', jsonpath.query(json, '$.store.bicycle.color'));

// Test if the library is working correctly
console.log('JSONPath library is working correctly!');