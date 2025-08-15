import { Injectable } from '@angular/core';

/**
 * Service for optimizing memory usage when working with large JSON documents
 * This service provides methods to reduce memory consumption and improve performance
 */
@Injectable({
  providedIn: 'root'
})
export class MemoryOptimizedJsonService {
  // Size threshold in bytes for when to use memory optimization
  private readonly SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB

  constructor() { }

  /**
   * Determines if a JSON string should use memory optimization based on its size
   * @param jsonString The JSON string to check
   * @returns True if the string exceeds the size threshold
   */
  shouldOptimizeMemory(jsonString: string): boolean {
    return jsonString.length > this.SIZE_THRESHOLD;
  }

  /**
   * Creates a stream-based JSON parser for large documents
   * This reduces memory usage by not loading the entire document into memory at once
   * @param jsonString The JSON string to parse
   * @param chunkCallback Function called for each parsed chunk
   * @param options Options for the streaming parser
   */
  streamParse(
    jsonString: string, 
    chunkCallback: (value: any, path: string) => void,
    options: { 
      paths?: string[], // Specific paths to extract
      maxDepth?: number // Maximum depth to parse
    } = {}
  ): void {
    // For small JSON strings, parse synchronously
    if (!this.shouldOptimizeMemory(jsonString)) {
      try {
        const result = JSON.parse(jsonString);
        this.traverseObject(result, '', chunkCallback, options);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
      return;
    }

    // For large JSON strings, use a streaming approach
    // This is a simplified implementation - in a real app, use a proper streaming JSON parser
    try {
      // Split the JSON string into chunks to avoid loading it all at once
      const chunkSize = 1024 * 1024; // 1MB chunks
      let position = 0;
      let depth = 0;
      let buffer = '';
      let inString = false;
      let escapeNext = false;
      let currentPath: string[] = [];
      
      // Process the JSON string in chunks
      while (position < jsonString.length) {
        const chunk = jsonString.substr(position, chunkSize);
        position += chunkSize;
        
        // Process each character in the chunk
        for (let i = 0; i < chunk.length; i++) {
          const char = chunk[i];
          buffer += char;
          
          // Handle string literals
          if (char === '"' && !escapeNext) {
            inString = !inString;
          }
          
          // Handle escape sequences
          if (char === '\\' && !escapeNext) {
            escapeNext = true;
          } else {
            escapeNext = false;
          }
          
          // Skip processing structural characters inside strings
          if (inString) {
            continue;
          }
          
          // Track object/array depth
          if (char === '{' || char === '[') {
            depth++;
            
            // If we're at a manageable depth, parse this subtree
            if (options.maxDepth && depth === options.maxDepth) {
              // Find the closing bracket for this subtree
              const subtree = this.extractBalancedSubtree(
                jsonString.substr(position + i - 1),
                char === '{' ? '{' : '['
              );
              
              if (subtree) {
                try {
                  const parsedSubtree = JSON.parse(subtree);
                  const path = currentPath.join('.');
                  
                  // Check if this path should be included
                  if (!options.paths || options.paths.some(p => path.startsWith(p) || p.startsWith(path))) {
                    chunkCallback(parsedSubtree, path);
                  }
                  
                  // Skip ahead
                  i += subtree.length - 1;
                  buffer = '';
                } catch (e) {
                  // Continue processing character by character
                }
              }
            }
          } else if (char === '}' || char === ']') {
            depth--;
            
            // If we've returned to the root level, we're done
            if (depth === 0) {
              try {
                const parsedJSON = JSON.parse(buffer);
                chunkCallback(parsedJSON, '');
                buffer = '';
              } catch (e) {
                // Continue processing
              }
            }
          } else if (char === ',' && depth === 1) {
            // At the root level, each comma-separated value can be processed independently
            try {
              // Extract the key-value pair or array item
              const item = buffer.substring(0, buffer.length - 1).trim();
              
              // For objects at root level
              if (jsonString[0] === '{' && item.includes(':')) {
                const colonPos = item.indexOf(':');
                const key = item.substring(0, colonPos).trim();
                const keyName = key.startsWith('"') ? JSON.parse(key) : key;
                const value = item.substring(colonPos + 1).trim();
                
                try {
                  const parsedValue = JSON.parse(value);
                  chunkCallback({ [keyName]: parsedValue }, keyName);
                } catch (e) {
                  // Skip invalid JSON
                }
              } 
              // For arrays at root level
              else if (jsonString[0] === '[') {
                try {
                  const parsedItem = JSON.parse(item);
                  const index = currentPath.length;
                  chunkCallback(parsedItem, `[${index}]`);
                  currentPath.push(`[${index}]`);
                } catch (e) {
                  // Skip invalid JSON
                }
              }
              
              buffer = '';
            } catch (e) {
              // Continue processing
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in stream parsing:', error);
    }
  }

  /**
   * Extracts a balanced subtree from a JSON string
   * @param jsonString The JSON string starting with { or [
   * @param openChar The opening character ({ or [)
   * @returns The balanced subtree as a string
   */
  private extractBalancedSubtree(jsonString: string, openChar: '{' | '['): string | null {
    const closeChar = openChar === '{' ? '}' : ']';
    let depth = 1;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 1; i < jsonString.length; i++) {
      const char = jsonString[i];
      
      // Handle string literals
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      
      // Handle escape sequences
      if (char === '\\' && !escapeNext) {
        escapeNext = true;
      } else {
        escapeNext = false;
      }
      
      // Skip processing structural characters inside strings
      if (inString) {
        continue;
      }
      
      // Track depth
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        
        // If we've found the matching closing bracket, return the subtree
        if (depth === 0) {
          return jsonString.substring(0, i + 1);
        }
      }
    }
    
    return null; // Unbalanced subtree
  }

  /**
   * Traverses an object and calls the callback for each value
   * @param obj The object to traverse
   * @param path The current path
   * @param callback Function called for each value
   * @param options Options for traversal
   */
  private traverseObject(
    obj: any, 
    path: string, 
    callback: (value: any, path: string) => void,
    options: { paths?: string[], maxDepth?: number } = {}
  ): void {
    // Check if we should process this path
    if (options.paths && options.paths.length > 0) {
      if (!options.paths.some(p => path.startsWith(p) || p.startsWith(path))) {
        return;
      }
    }
    
    // Check if we've reached the maximum depth
    const depth = path ? path.split('.').length : 0;
    if (options.maxDepth && depth >= options.maxDepth) {
      callback(obj, path);
      return;
    }
    
    // Call the callback for this object
    callback(obj, path);
    
    // Recursively process object properties and array items
    if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const itemPath = path ? `${path}[${index}]` : `[${index}]`;
          this.traverseObject(item, itemPath, callback, options);
        });
      } else {
        Object.keys(obj).forEach(key => {
          const propPath = path ? `${path}.${key}` : key;
          this.traverseObject(obj[key], propPath, callback, options);
        });
      }
    }
  }

  /**
   * Creates a memory-efficient representation of a JSON object
   * by replacing duplicate objects with references
   * @param jsonString The JSON string to optimize
   * @returns The memory-optimized object
   */
  createMemoryEfficientObject(jsonString: string): any {
    try {
      const parsed = JSON.parse(jsonString);
      
      // For small objects, return as-is
      if (!this.shouldOptimizeMemory(jsonString)) {
        return parsed;
      }
      
      // For large objects, optimize memory usage
      const seen = new Map();
      return this.deduplicateObject(parsed, seen);
    } catch (error) {
      console.error('Error creating memory-efficient object:', error);
      return null;
    }
  }

  /**
   * Deduplicates objects to reduce memory usage
   * @param obj The object to deduplicate
   * @param seen Map of already seen objects
   * @returns The deduplicated object
   */
  private deduplicateObject(obj: any, seen: Map<string, any>): any {
    // Handle primitive values
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.deduplicateObject(item, seen));
    }
    
    // Handle objects
    const keys = Object.keys(obj).sort();
    const keyValues = keys.map(key => `${key}:${JSON.stringify(obj[key])}`).join(',');
    
    // Check if we've seen this object before
    if (seen.has(keyValues)) {
      return seen.get(keyValues);
    }
    
    // Create a new object with deduplicated properties
    const result: any = {};
    seen.set(keyValues, result);
    
    for (const key of keys) {
      result[key] = this.deduplicateObject(obj[key], seen);
    }
    
    return result;
  }

  /**
   * Disposes of large objects to free memory
   * @param obj The object to dispose
   */
  disposeObject(obj: any): void {
    if (obj && typeof obj === 'object') {
      // Clear all properties to help garbage collection
      if (Array.isArray(obj)) {
        obj.length = 0;
      } else {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            delete obj[key];
          }
        }
      }
    }
  }
}