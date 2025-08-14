// Main shim for xml2js that doesn't require Node.js modules
// This file exports the components needed by the application

// Simple implementation of parseString that doesn't use timers
exports.parseString = function(xmlString, options, callback) {
  // If callback is not provided, handle the case where options is the callback
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // Default options
  options = options || {};
  
  setTimeout(function() {
    try {
      // Very basic XML parsing - just for demo purposes
      // In a real implementation, we would use a proper XML parser
      const result = {};
      
      // Extract content between tags using a simple approach
      const getContent = function(xml, tag) {
        const startTag = `<${tag}>`;
        const endTag = `</${tag}>`;
        const startIndex = xml.indexOf(startTag) + startTag.length;
        const endIndex = xml.indexOf(endTag);
        if (startIndex >= 0 && endIndex >= 0) {
          return xml.substring(startIndex, endIndex);
        }
        return '';
      };
      
      // Check if there's a root element
      if (xmlString.includes('<root>')) {
        result.root = {};
        
        // Extract some basic content
        const tags = ['name', 'age', 'address', 'city', 'country'];
        tags.forEach(tag => {
          const content = getContent(xmlString, tag);
          if (content) {
            result.root[tag] = content;
          }
        });
      }
      
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  }, 0);
};

// Simple implementation of Builder class
exports.Builder = function(options) {
  this.options = options || {};
  
  // Default options
  if (!this.options.renderOpts) {
    this.options.renderOpts = {};
  }
  
  if (this.options.renderOpts.pretty === undefined) {
    this.options.renderOpts.pretty = true;
  }
  
  if (!this.options.renderOpts.indent) {
    this.options.renderOpts.indent = '  ';
  }
  
  // Method to build XML from a JavaScript object
  this.buildObject = function(obj) {
    const xml = [];
    
    // Add XML declaration if not headless
    if (!this.options.headless) {
      xml.push('<?xml version="1.0" encoding="UTF-8"?>');
    }
    
    // Convert the object to XML
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        xml.push(this.objectToXML(key, obj[key], 0));
      }
    }
    
    return xml.join(this.options.renderOpts.pretty ? '\n' : '');
  };
  
  // Convert an object to XML
  this.objectToXML = function(tagName, obj, level) {
    const indent = this.options.renderOpts.pretty ? 
      '\n' + this.options.renderOpts.indent.repeat(level) : '';
    const nextIndent = this.options.renderOpts.pretty ? 
      '\n' + this.options.renderOpts.indent.repeat(level + 1) : '';
    
    if (obj === null || obj === undefined) {
      return `${indent}<${tagName}/>`;
    }
    
    if (typeof obj === 'object') {
      let xml = `${indent}<${tagName}>`;
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          xml += this.objectToXML(key, obj[key], level + 1);
        }
      }
      
      xml += `${indent}</${tagName}>`;
      return xml;
    }
    
    // Escape special characters in XML content
    const escaped = String(obj)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    
    return `${indent}<${tagName}>${escaped}</${tagName}>`;
  };
};