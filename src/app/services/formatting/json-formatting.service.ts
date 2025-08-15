import {Injectable} from '@angular/core';
import {IJsonFormattingService} from '../../interfaces';
import * as JSON5 from 'json5';

/**
 * Service for JSON formatting operations
 * Follows the Single Responsibility Principle by focusing only on formatting concerns
 */
@Injectable({
    providedIn: 'root'
})
export class JsonFormattingService implements IJsonFormattingService {
    // Default indentation settings
    private indentSize = 2;
    private indentChar = ' ';

    constructor() {
    }

    /**
     * Sets custom indentation settings
     * @param size The number of characters to use for indentation
     * @param char The character to use for indentation (space or tab)
     */
    setIndentation(size: number, char: string): void {
        this.indentSize = size;
        this.indentChar = char;
    }

    /**
     * Enforces strict double quotes in JSON keys and string values
     * @param jsonString The JSON string to process
     * @returns The JSON string with strict double quotes
     */
    enforceStrictDoubleQuotes(jsonString: string): string {
        try {
            // First try to parse the JSON to see if it's valid standard JSON
            const jsonObj = JSON.parse(jsonString || '{}');

            // Use JSON.stringify to ensure all keys and string values use double quotes
            return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
        } catch (e) {
            // If standard JSON parsing fails, try using JSON5 parser
            // This handles single quotes, trailing commas, comments, etc.
            try {
                // Parse with JSON5 which is more lenient
                const jsonObj = JSON5.parse(jsonString || '{}');

                // Convert back to standard JSON with double quotes
                return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
            } catch (e) {
                // If JSON5 parsing also fails, it's likely not valid JSON at all
                const errorMessage = e instanceof Error ? e.message : String(e);
                throw new Error(`Error enforcing strict double quotes: ${errorMessage}`);
            }
        }
    }

    /**
     * Fixes inconsistent indentation in arrays and objects
     * @param jsonString The JSON string to fix
     * @returns The JSON string with consistent indentation
     */
    fixInconsistentIndentation(jsonString: string): string {
        try {
            // Parse the JSON to get the object structure
            const jsonObj = JSON.parse(jsonString || '{}');

            // Use JSON.stringify with a custom replacer to ensure consistent indentation
            return JSON.stringify(jsonObj, null, this.indentChar.repeat(this.indentSize));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error fixing indentation: ${errorMessage}`);
        }
    }

    /**
     * Beautifies a JSON string
     * @param jsonString The JSON string to beautify
     * @returns The beautified JSON string
     */
    beautifyJson(jsonString: string): string {
        try {
            // First enforce strict double quotes
            const strictJson = this.enforceStrictDoubleQuotes(jsonString);

            // Then fix inconsistent indentation
            return this.fixInconsistentIndentation(strictJson);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error beautifying JSON: ${errorMessage}`);
        }
    }

    /**
     * Minifies a JSON string
     * @param jsonString The JSON string to minify
     * @returns The minified JSON string
     */
    minifyJson(jsonString: string): string {
        try {
            // First enforce strict double quotes
            const strictJson = this.enforceStrictDoubleQuotes(jsonString);

            // Parse the JSON to get the object structure
            const jsonObj = JSON.parse(strictJson);

            // Use JSON.stringify without indentation to minify
            return JSON.stringify(jsonObj);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error minifying JSON: ${errorMessage}`);
        }
    }

    /**
     * Sorts the keys of an object alphabetically
     * @param obj The object to sort
     * @returns A new object with sorted keys
     */
    sortObjectKeys(obj: any): any {
        // If null or not an object, return as is
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        // Handle arrays - map each item and recursively sort if it's an object
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }

        // Create a new object with sorted keys
        const sortedObj: any = {};
        Object.keys(obj).sort().forEach(key => {
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        });

        return sortedObj;
    }
}