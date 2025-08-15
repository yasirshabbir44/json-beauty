import {Injectable} from '@angular/core';
import {IJsonPathService} from '../../interfaces';
import * as jsonpath from 'jsonpath';

/**
 * Service for JSON path operations
 * Follows the Single Responsibility Principle by focusing only on path concerns
 */
@Injectable({
    providedIn: 'root'
})
export class JsonPathService implements IJsonPathService {
    // Default indentation settings
    private indentSize = 2;
    private indentChar = ' ';

    constructor() {
    }

    /**
     * Finds all JSON paths in a JSON string
     * @param jsonString The JSON string to analyze
     * @returns Array of JSON paths
     */
    findJsonPaths(jsonString: string): string[] {
        try {
            const obj = JSON.parse(jsonString || '{}');
            const paths: string[] = [];
            this.collectPaths(obj, '$', paths);
            return paths;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error finding JSON paths: ${errorMessage}`);
        }
    }

    /**
     * Collects paths from a JSON object
     * @param obj The JSON object
     * @param currentPath The current path being processed
     * @param paths Array to store the collected paths
     */
    collectPaths(obj: any, currentPath: string, paths: string[]): void {
        if (obj === null || obj === undefined) {
            paths.push(currentPath);
            return;
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                paths.push(`${currentPath}`);
            } else {
                for (let i = 0; i < obj.length; i++) {
                    this.collectPaths(obj[i], `${currentPath}[${i}]`, paths);
                }
            }
        } else if (typeof obj === 'object') {
            if (Object.keys(obj).length === 0) {
                paths.push(`${currentPath}`);
            } else {
                for (const key of Object.keys(obj)) {
                    const newPath = currentPath === '$' ? `${currentPath}.${key}` : `${currentPath}.${key}`;
                    this.collectPaths(obj[key], newPath, paths);
                }
            }
        } else {
            paths.push(currentPath);
        }
    }

    /**
     * Queries a JSON string using a JSON path expression
     * @param jsonString The JSON string to query
     * @param jsonPath The JSON path expression
     * @returns The query result
     */
    queryJsonPath(jsonString: string, jsonPath: string): {
        result: any;
        error?: string;
    } {
        try {
            const jsonObj = JSON.parse(jsonString || '{}');

            // Ensure the path starts with $ if not already
            const normalizedPath = jsonPath.startsWith('$') ? jsonPath : `$${jsonPath}`;

            // Use the jsonpath library for comprehensive JSONPath support
            const result = jsonpath.query(jsonObj, normalizedPath);

            return {
                result,
                error: undefined
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                result: null,
                error: `Error querying JSON path: ${errorMessage}`
            };
        }
    }

    /**
     * Evaluates a JSON path against a JSON object
     * This is a legacy method kept for backward compatibility
     * @param obj The JSON object
     * @param path The JSON path
     * @returns The evaluation result
     */
    evaluateJsonPath(obj: any, path: string): any {
        try {
            // Ensure the path starts with $ if not already
            const normalizedPath = path.startsWith('$') ? path : `$${path}`;

            // Use the jsonpath library for comprehensive JSONPath support
            const result = jsonpath.query(obj, normalizedPath);

            // Return the first result or undefined if no results
            return result.length > 0 ? result[0] : undefined;
        } catch (error) {
            console.error('Error evaluating JSONPath:', error);
            return undefined;
        }
    }
}