import {Injectable} from '@angular/core';
import {IJsonPathService} from '../../interfaces';
import {loadJsonpath} from '../../utils/lazy-import.util';

/**
 * Service for JSON path operations
 * Follows the Single Responsibility Principle by focusing only on path concerns
 */
@Injectable()
export class JsonPathService implements IJsonPathService {
    private indentSize = 2;
    private indentChar = ' ';

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

    collectPaths(obj: any, currentPath: string, paths: string[]): void {
        if (obj === null || obj === undefined) {
            paths.push(currentPath);
            return;
        }

        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                paths.push(currentPath);
            } else {
                obj.forEach((item, index) => {
                    this.collectPaths(item, `${currentPath}[${index}]`, paths);
                });
            }
            return;
        }

        if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) {
                paths.push(currentPath);
            } else {
                keys.forEach(key => {
                    this.collectPaths(obj[key], `${currentPath}.${key}`, paths);
                });
            }
            return;
        }

        paths.push(currentPath);
    }

    async queryJsonPath(jsonString: string, jsonPath: string): Promise<{
        result: any;
        error?: string;
    }> {
        try {
            const jsonpath = await loadJsonpath();
            const jsonObj = JSON.parse(jsonString || '{}');
            const normalizedPath = jsonPath.startsWith('$') ? jsonPath : `$${jsonPath}`;
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

    async evaluateJsonPath(obj: any, path: string): Promise<any> {
        try {
            const jsonpath = await loadJsonpath();
            const normalizedPath = path.startsWith('$') ? path : `$${path}`;
            const result = jsonpath.query(obj, normalizedPath);
            return result.length > 0 ? result[0] : undefined;
        } catch (error) {
            console.error('Error evaluating JSONPath:', error);
            return undefined;
        }
    }
}
