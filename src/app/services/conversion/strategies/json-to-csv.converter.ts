import {Injectable} from '@angular/core';
import {BaseConverter} from '../base/base-converter';

/**
 * Converter for JSON to CSV conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
    providedIn: 'root'
})
export class JsonToCsvConverter extends BaseConverter {
    /**
     * Converts JSON string to CSV string
     * @param jsonString The JSON string to convert
     * @returns Promise resolving to the CSV string
     */
    async convert(jsonString: string): Promise<string> {
        return Promise.resolve(this.handleConversionError(() => {
            // Parse JSON with fallback to empty array
            const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_ARRAY);
            
            // Ensure we're working with an array
            const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];
            
            // Handle empty array case
            if (jsonArray.length === 0) {
                return this.DEFAULT_EMPTY_STRING;
            }
            
            // Handle primitive array case
            const isPrimitiveArray = typeof jsonArray[0] !== 'object' || jsonArray[0] === null;
            if (isPrimitiveArray) {
                return jsonArray.map(item => this.escapeCsvValue(String(item))).join('\n');
            }
            
            // Handle object array case - extract headers and generate content
            const headers = this.extractCsvHeaders(jsonArray);
            return this.generateCsvContent(jsonArray, headers);
        }, 'JSON to CSV'));
    }

    /**
     * Extracts CSV headers from an array of objects
     * @param jsonArray The array of objects
     * @returns Array of header strings
     */
    extractCsvHeaders(jsonArray: any[]): string[] {
        const headers = new Set<string>();

        // Collect all unique keys from all objects
        for (const item of jsonArray) {
            if (typeof item === 'object' && item !== null) {
                this.collectKeys(item, this.DEFAULT_EMPTY_STRING, headers);
            }
        }

        return Array.from(headers);
    }

    /**
     * Generates CSV content from JSON array and headers
     * @param jsonArray The JSON array
     * @param headers The CSV headers
     * @returns The CSV string
     */
    private generateCsvContent(jsonArray: any[], headers: string[]): string {
        // Return empty string if no headers
        if (headers.length === 0) {
            return this.DEFAULT_EMPTY_STRING;
        }

        // Create header row with escaped values
        const headerRow = headers
            .map(header => this.escapeCsvValue(header))
            .join(',');

        // Create data rows by mapping each item and header
        const dataRows = jsonArray.map(item => 
            headers
                .map(header => this.formatCsvValue(this.getNestedValue(item, header)))
                .join(',')
        );

        // Combine header and data rows
        return [headerRow, ...dataRows].join('\n');
    }

    /**
     * Collects all keys from an object, including nested objects
     * @param obj The object to collect keys from
     * @param prefix The current key prefix
     * @param keys The set to store keys
     */
    private collectKeys(obj: any, prefix: string, keys: Set<string>): void {
        // Early return for non-objects
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
                this.collectKeys(value, newKey, keys);
            } else {
                // Add leaf node key to the set
                keys.add(newKey);
            }
        });
    }

    /**
     * Gets a nested value from an object using a dot-notation path
     * @param obj The object to get the value from
     * @param path The path to the value
     * @returns The value at the path or undefined if path doesn't exist
     */
    private getNestedValue(obj: any, path: string): any {
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

    /**
     * Formats a value for CSV output
     * @param value The value to format
     * @returns The formatted string
     */
    private formatCsvValue(value: any): string {
        if (value === null || value === undefined) {
            return this.DEFAULT_EMPTY_STRING;
        }

        if (typeof value === 'object') {
            // Handle both arrays and objects with a single line
            return this.escapeCsvValue(JSON.stringify(value));
        }

        return this.escapeCsvValue(String(value));
    }

    /**
     * Escapes a value for CSV output according to RFC 4180
     * @param value The value to escape
     * @returns The escaped string
     */
    private escapeCsvValue(value: string): string {
        // Handle empty values
        if (!value) {
            return this.DEFAULT_EMPTY_STRING;
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
}