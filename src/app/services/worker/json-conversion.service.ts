import { Injectable } from '@angular/core';
import { LoadingService } from '../loading/loading.service';
import { BaseWorkerService } from './base-worker.service';
import { IJsonConversionService } from './worker.interfaces';

/**
 * Service for JSON conversion operations
 * Follows Single Responsibility Principle by focusing only on JSON conversion operations
 * Extends BaseWorkerService for worker functionality
 * Implements IJsonConversionService interface following Dependency Inversion Principle
 */
@Injectable({
  providedIn: 'root'
})
export class JsonConversionService extends BaseWorkerService implements IJsonConversionService {
  constructor(protected override loadingService: LoadingService) {
    super(loadingService);
  }

  /**
   * Convert JSON to YAML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the YAML string
   */
  jsonToYaml(jsonString: string): Promise<string> {
    return this.runInWorker('jsonToYaml', { jsonString });
  }

  /**
   * Convert JSON to XML format
   * @param jsonString The JSON string to convert
   * @returns Promise with the XML string
   */
  jsonToXml(jsonString: string): Promise<string> {
    return this.runInWorker('jsonToXml', { jsonString });
  }

  /**
   * Convert JSON to CSV format
   * @param jsonString The JSON string to convert
   * @returns Promise with the CSV string
   */
  jsonToCsv(jsonString: string): Promise<string> {
    return this.runInWorker('jsonToCsv', { jsonString });
  }

  /**
   * Get the worker code as a string
   * Overrides the base method to provide JSON conversion specific worker code
   * @returns The worker code as a string
   */
  protected override getWorkerCode(): string {
    return `
      // Worker code for JSON conversion operations
      self.onmessage = function(e) {
        const { taskName, data } = e.data;
        
        try {
          // Process task based on taskName
          let result;
          
          switch (taskName) {
            case 'jsonToYaml':
              // Convert JSON to YAML
              result = convertJsonToYaml(data.jsonString);
              break;
              
            case 'jsonToXml':
              // Convert JSON to XML
              result = convertJsonToXml(data.jsonString);
              break;
              
            case 'jsonToCsv':
              // Convert JSON to CSV
              result = convertJsonToCsv(data.jsonString);
              break;
              
            default:
              throw new Error('Unknown task: ' + taskName);
          }
          
          // Send result back to main thread
          self.postMessage({ result });
        } catch (error) {
          // Send error back to main thread
          self.postMessage({ 
            error: { 
              message: error.message, 
              stack: error.stack 
            } 
          });
        }
      };
      
      // Helper function to convert JSON to YAML
      function convertJsonToYaml(jsonString) {
        // Parse JSON
        const jsonObj = JSON.parse(jsonString);
        
        // Simple YAML conversion (for more complex conversion, a library would be used)
        return convertObjectToYaml(jsonObj, 0);
      }
      
      // Helper function to convert object to YAML
      function convertObjectToYaml(obj, indent) {
        let yaml = '';
        const indentStr = ' '.repeat(indent);
        
        if (Array.isArray(obj)) {
          // Handle arrays
          if (obj.length === 0) {
            return '[]';
          }
          
          for (let i = 0; i < obj.length; i++) {
            const value = obj[i];
            if (typeof value === 'object' && value !== null) {
              yaml += indentStr + '- \\n' + convertObjectToYaml(value, indent + 2);
            } else {
              yaml += indentStr + '- ' + formatYamlValue(value) + '\\n';
            }
          }
        } else {
          // Handle objects
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              const value = obj[key];
              if (typeof value === 'object' && value !== null) {
                yaml += indentStr + key + ':\\n' + convertObjectToYaml(value, indent + 2);
              } else {
                yaml += indentStr + key + ': ' + formatYamlValue(value) + '\\n';
              }
            }
          }
        }
        
        return yaml;
      }
      
      // Helper function to format YAML values
      function formatYamlValue(value) {
        if (value === null) return 'null';
        if (value === undefined) return '';
        if (typeof value === 'string') {
          // Escape special characters
          if (value.includes('\\n') || value.includes(':') || value.includes('{') || 
              value.includes('}') || value.includes('[') || value.includes(']')) {
            return '"' + value.replace(/"/g, '\\\\"') + '"';
          }
          return value;
        }
        return String(value);
      }
      
      // Helper function to convert JSON to XML
      function convertJsonToXml(jsonString) {
        // Parse JSON
        const jsonObj = JSON.parse(jsonString);
        
        // Convert to XML
        return '<?xml version="1.0" encoding="UTF-8"?>\\n' + 
               convertObjectToXml(jsonObj, 'root', 0);
      }
      
      // Helper function to convert object to XML
      function convertObjectToXml(obj, nodeName, indent) {
        let xml = '';
        const indentStr = ' '.repeat(indent);
        
        if (Array.isArray(obj)) {
          // Handle arrays
          if (obj.length === 0) {
            return indentStr + '<' + nodeName + '/>\\n';
          }
          
          xml += indentStr + '<' + nodeName + '>\\n';
          for (let i = 0; i < obj.length; i++) {
            xml += convertObjectToXml(obj[i], 'item', indent + 2);
          }
          xml += indentStr + '</' + nodeName + '>\\n';
        } else if (typeof obj === 'object' && obj !== null) {
          // Handle objects
          xml += indentStr + '<' + nodeName + '>\\n';
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              xml += convertObjectToXml(obj[key], key, indent + 2);
            }
          }
          xml += indentStr + '</' + nodeName + '>\\n';
        } else {
          // Handle primitive values
          xml += indentStr + '<' + nodeName + '>' + 
                 formatXmlValue(obj) + 
                 '</' + nodeName + '>\\n';
        }
        
        return xml;
      }
      
      // Helper function to format XML values
      function formatXmlValue(value) {
        if (value === null) return '';
        if (value === undefined) return '';
        const str = String(value);
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
      }
      
      // Helper function to convert JSON to CSV
      function convertJsonToCsv(jsonString) {
        // Parse JSON
        const jsonObj = JSON.parse(jsonString);
        
        // Handle empty or non-array input
        if (!Array.isArray(jsonObj) || jsonObj.length === 0) {
          if (typeof jsonObj === 'object' && jsonObj !== null) {
            // Convert single object to array
            return convertArrayToCsv([jsonObj]);
          }
          return '';
        }
        
        return convertArrayToCsv(jsonObj);
      }
      
      // Helper function to convert array to CSV
      function convertArrayToCsv(arr) {
        // Get all possible headers
        const headers = new Set();
        arr.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => headers.add(key));
          }
        });
        
        // Convert headers to array
        const headerArr = Array.from(headers);
        
        // Create CSV header row
        let csv = headerArr.map(header => escapeCsvValue(header)).join(',') + '\\n';
        
        // Create CSV data rows
        arr.forEach(item => {
          const row = headerArr.map(header => {
            if (typeof item === 'object' && item !== null && header in item) {
              const value = item[header];
              if (typeof value === 'object' && value !== null) {
                return escapeCsvValue(JSON.stringify(value));
              }
              return escapeCsvValue(value);
            }
            return '';
          });
          
          csv += row.join(',') + '\\n';
        });
        
        return csv;
      }
      
      // Helper function to escape CSV values
      function escapeCsvValue(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }
    `;
  }
}