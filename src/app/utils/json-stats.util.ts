import {JsonValue} from '../types/json.types';

export interface JsonStructureStats {
    objects: number;
    arrays: number;
    keys: number;
    values: number;
}

/**
 * Walks parsed JSON and counts structural nodes (objects, arrays, keys, leaf values).
 */
export function countJsonStructure(value: JsonValue | null | undefined): JsonStructureStats {
    const stats: JsonStructureStats = {objects: 0, arrays: 0, keys: 0, values: 0};

    const walk = (node: JsonValue): void => {
        if (node === null || typeof node !== 'object') {
            stats.values += 1;
            return;
        }

        if (Array.isArray(node)) {
            stats.arrays += 1;
            for (const item of node) {
                walk(item);
            }
            return;
        }

        stats.objects += 1;
        for (const key of Object.keys(node)) {
            stats.keys += 1;
            walk(node[key]);
        }
    };

    if (value !== null && value !== undefined) {
        walk(value);
    }

    return stats;
}
