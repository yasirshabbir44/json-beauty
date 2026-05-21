import {JsonValue} from '../../types/json.types';

/**
 * Resolves a user override for a blueprint path or field key.
 */
export function resolveFieldOverride(
    overrides: Record<string, JsonValue> | undefined,
    path: string,
    key?: string
): JsonValue | undefined {
    if (!overrides || Object.keys(overrides).length === 0) {
        return undefined;
    }

    const candidates = [
        path,
        path.replace(/\[\]/g, ''),
        key,
        key && path.includes('.') ? path.split('.').pop() : undefined
    ].filter((c): c is string => !!c && c.length > 0);

    for (const candidate of candidates) {
        if (Object.prototype.hasOwnProperty.call(overrides, candidate)) {
            return overrides[candidate];
        }
    }

    return undefined;
}

/**
 * Deep-merges override values into generated data (override wins on conflicts).
 */
export function applyFieldOverrides(
    generated: JsonValue,
    overrides: Record<string, JsonValue> | undefined
): JsonValue {
    if (!overrides || Object.keys(overrides).length === 0) {
        return generated;
    }

    if (typeof generated !== 'object' || generated === null) {
        return generated;
    }

    const result = Array.isArray(generated) ? [...generated] : {...(generated as Record<string, JsonValue>)};

    for (const [overrideKey, overrideValue] of Object.entries(overrides)) {
        if (!overrideKey.includes('.') && !overrideKey.includes('[')) {
            if (Array.isArray(result)) {
                continue;
            }
            (result as Record<string, JsonValue>)[overrideKey] = cloneJsonValue(overrideValue);
            continue;
        }

        setByPath(result, overrideKey, overrideValue);
    }

    return result as JsonValue;
}

function setByPath(target: JsonValue, path: string, value: JsonValue): void {
    const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    if (segments.length === 0) {
        return;
    }

    let current: JsonValue = target;
    for (let i = 0; i < segments.length - 1; i++) {
        const seg = segments[i];
        const nextSeg = segments[i + 1];
        const index = Number.parseInt(seg, 10);
        const isIndex = !Number.isNaN(index) && String(index) === seg;

        if (Array.isArray(current)) {
            if (!isIndex) {
                return;
            }
            if (current[index] === undefined) {
                current[index] = Number.isNaN(Number.parseInt(nextSeg, 10)) ? {} : [];
            }
            current = current[index];
        } else if (current && typeof current === 'object') {
            const obj = current as Record<string, JsonValue>;
            if (obj[seg] === undefined) {
                obj[seg] = Number.isNaN(Number.parseInt(nextSeg, 10)) ? {} : [];
            }
            current = obj[seg];
        } else {
            return;
        }
    }

    const last = segments[segments.length - 1];
    const lastIndex = Number.parseInt(last, 10);
    const isLastIndex = !Number.isNaN(lastIndex) && String(lastIndex) === last;

    if (Array.isArray(current) && isLastIndex) {
        current[lastIndex] = cloneJsonValue(value);
    } else if (current && typeof current === 'object' && !Array.isArray(current)) {
        (current as Record<string, JsonValue>)[last] = cloneJsonValue(value);
    }
}

function cloneJsonValue(value: JsonValue): JsonValue {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    return JSON.parse(JSON.stringify(value)) as JsonValue;
}
