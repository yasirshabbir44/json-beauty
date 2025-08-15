import {Injectable} from '@angular/core';
import {IJsonToFormatConverter} from '../../../interfaces/converters/converter.interface';

/**
 * Converter for JSON to CSV conversion
 * Implements the Strategy pattern for JSON to CSV conversion
 */
@Injectable()
export class JsonToCsvConverter implements IJsonToFormatConverter<string> {
    // Constants
    private readonly DEFAULT_EMPTY_ARRAY = '[]';
    private readonly DEFAULT_EMPTY_STRING = '';

    /**
     * Converts JSON string to CSV format
     * @param jsonString The JSON string to convert
     * @returns The CSV string
     */
    convert(jsonString: string): string {
        try {
            const jsonObj = JSON.parse(jsonString || this.DEFAULT_EMPTY_ARRAY);

            // If it's not an array, wrap it in an array
            const jsonArray = Array.isArray(jsonObj) ? jsonObj : [jsonObj];

            if (jsonArray.length === 0) {
                return this.DEFAULT_EMPTY_STRING;
            }

            // Handle different JSON structures
            if (typeof jsonArray[0] !== 'object' || jsonArray[0] === null) {
                // Simple array of primitives
                return jsonArray.map(item => this.escapeCsvValue(String(item))).join('\n');
            }

            // For array of objects, extract headers
            const headers = this.extractCsvHeaders(jsonArray);

            // Generate CSV content
            return this.generateCsvContent(jsonArray, headers);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error converting JSON to CSV: ${errorMessage}`);
        }
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
     * Generates CSV content from a JSON array and headers
     * @param jsonArray The JSON array
     * @param headers The CSV headers
     * @returns The CSV string
     */
    private generateCsvContent(jsonArray: any[], headers: string[]): string {
        const csvRows = [];

        // Add headers row
        csvRows.push(headers.join(','));

        // Add data rows
        for (const item of jsonArray) {
            const row = headers.map(header => {
                const value = this.getNestedValue(item, header);
                return this.escapeCsvValue(this.formatCsvValue(value));
            });
            csvRows.push(row.join(','));
        }

        return csvRows.join('\n');
    }

    /**
     * Recursively collects all keys from an object
     * @param obj The object to collect keys from
     * @param prefix The current path prefix
     * @param keys Set to store the collected keys
     */
    private collectKeys(obj: any, prefix: string, keys: Set<string>): void {
        if (typeof obj !== 'object' || obj === null) {
            return;
        }

        for (const key of Object.keys(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                // Recursively collect keys for nested objects
                this.collectKeys(obj[key], fullKey, keys);
            } else {
                // Add the key to the set
                keys.add(fullKey);
            }
        }
    }

    /**
     * Gets a nested value from an object using a dot-notation path
     * @param obj The object to get the value from
     * @param path The path to the value
     * @returns The value at the path
     */
    private getNestedValue(obj: any, path: string): any {
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

    /**
     * Formats a value for CSV output
     * @param value The value to format
     * @returns The formatted value as a string
     */
    private formatCsvValue(value: any): string {
        if (value === undefined || value === null) {
            return this.DEFAULT_EMPTY_STRING;
        }

        if (typeof value === 'object') {
            return JSON.stringify(value);
        }

        return String(value);
    }

    /**
     * Escapes a value for CSV format
     * @param value The value to escape
     * @returns The escaped value
     */
    private escapeCsvValue(value: string): string {
        // If the value contains commas, newlines, or quotes, wrap it in quotes
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
            // Double up any quotes in the value
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}