import {JsonValue} from '../../types/json.types';
import {
    BlueprintNode,
    BlueprintSource,
    BlueprintValueKind,
    StructureBlueprint
} from '../../types/mock-data.types';
import {inferSemanticHint} from './context-inference';

const DEFAULT_ARRAY_LENGTH = 3;
const MAX_ARRAY_LENGTH = 25;

interface JsonSchemaFragment {
    type?: string | string[];
    enum?: (string | number | boolean | null)[];
    format?: string;
    minimum?: number;
    maximum?: number;
    items?: JsonSchemaFragment;
    properties?: Record<string, JsonSchemaFragment>;
    required?: string[];
    minItems?: number;
    maxItems?: number;
    allOf?: JsonSchemaFragment[];
    anyOf?: JsonSchemaFragment[];
    oneOf?: JsonSchemaFragment[];
    $ref?: string;
}

/**
 * Builds a finalized structural blueprint from sample JSON or JSON Schema.
 */
export class StructureBlueprintBuilder {
    finalizeFromJsonSample(jsonString: string): StructureBlueprint {
        const value = JSON.parse(jsonString) as JsonValue;
        return {
            version: 1,
            finalized: true,
            source: 'json-sample',
            root: this.nodeFromValue(value, '', undefined)
        };
    }

    finalizeFromJsonSchema(schemaString: string): StructureBlueprint {
        const schema = JSON.parse(schemaString) as JsonSchemaFragment;
        return {
            version: 1,
            finalized: true,
            source: 'json-schema',
            root: this.nodeFromSchema(schema, '', undefined)
        };
    }

    private nodeFromValue(value: JsonValue, path: string, key?: string): BlueprintNode {
        if (value === null) {
            return this.leafNode('null', path, key);
        }
        if (Array.isArray(value)) {
            const length = Math.min(Math.max(value.length, 1), MAX_ARRAY_LENGTH);
            const itemTemplate =
                value.length > 0
                    ? this.nodeFromValue(value[0], `${path}[]`, undefined)
                    : this.leafNode('string', `${path}[]`, undefined);
            return {
                kind: 'array',
                context: {key, path, semantic: inferSemanticHint(key, path, 'integer')},
                itemTemplate,
                arrayLength: length
            };
        }
        if (typeof value === 'object') {
            const properties: Record<string, BlueprintNode> = {};
            const propertyOrder: string[] = [];
            for (const propKey of Object.keys(value)) {
                const childPath = path ? `${path}.${propKey}` : propKey;
                properties[propKey] = this.nodeFromValue(
                    (value as Record<string, JsonValue>)[propKey],
                    childPath,
                    propKey
                );
                propertyOrder.push(propKey);
            }
            return {
                kind: 'object',
                context: {key, path, semantic: inferSemanticHint(key, path, 'string')},
                properties,
                propertyOrder
            };
        }
        if (typeof value === 'boolean') {
            return this.leafNode('boolean', path, key);
        }
        if (typeof value === 'number') {
            const kind: BlueprintValueKind = Number.isInteger(value) ? 'integer' : 'number';
            return this.leafNode(kind, path, key);
        }
        return this.leafNode('string', path, key);
    }

    private leafNode(kind: BlueprintValueKind, path: string, key?: string): BlueprintNode {
        const semanticKind =
            kind === 'boolean' ? 'boolean' : kind === 'integer' ? 'integer' : kind === 'number' ? 'number' : 'string';
        return {
            kind,
            context: {
                key,
                path,
                semantic: inferSemanticHint(key, path, semanticKind)
            }
        };
    }

    private nodeFromSchema(schema: JsonSchemaFragment, path: string, key?: string): BlueprintNode {
        const resolved = this.resolveSchema(schema);

        if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
            const first = resolved.enum[0];
            const kind = this.kindFromValue(first);
            return {
                kind,
                context: {
                    key,
                    path,
                    semantic: inferSemanticHint(
                        key,
                        path,
                        kind === 'boolean' ? 'boolean' : kind === 'integer' ? 'integer' : kind === 'number' ? 'number' : 'string',
                        resolved.format
                    )
                },
                enumValues: resolved.enum,
                stringFormat: resolved.format,
                minimum: resolved.minimum,
                maximum: resolved.maximum
            };
        }

        const type = this.resolveType(resolved);
        if (type === 'null') {
            return this.leafNode('null', path, key);
        }
        if (type === 'array') {
            const items = resolved.items ?? {type: 'string'};
            const minItems = resolved.minItems ?? DEFAULT_ARRAY_LENGTH;
            const maxItems = resolved.maxItems ?? minItems;
            const length = Math.min(Math.max(minItems, 1), MAX_ARRAY_LENGTH, maxItems);
            return {
                kind: 'array',
                context: {key, path, semantic: inferSemanticHint(key, path, 'integer')},
                itemTemplate: this.nodeFromSchema(items, `${path}[]`, undefined),
                arrayLength: length
            };
        }
        if (type === 'object') {
            const properties: Record<string, BlueprintNode> = {};
            const propertyOrder: string[] = [];
            const props = resolved.properties ?? {};
            for (const propKey of Object.keys(props)) {
                const childPath = path ? `${path}.${propKey}` : propKey;
                properties[propKey] = this.nodeFromSchema(props[propKey], childPath, propKey);
                propertyOrder.push(propKey);
            }
            return {
                kind: 'object',
                context: {key, path, semantic: inferSemanticHint(key, path, 'string')},
                properties,
                propertyOrder
            };
        }

        const kind = type as BlueprintValueKind;
        const semanticKind =
            kind === 'boolean' ? 'boolean' : kind === 'integer' ? 'integer' : kind === 'number' ? 'number' : 'string';
        return {
            kind,
            context: {
                key,
                path,
                semantic: inferSemanticHint(key, path, semanticKind, resolved.format)
            },
            stringFormat: resolved.format,
            minimum: resolved.minimum,
            maximum: resolved.maximum
        };
    }

    private resolveSchema(schema: JsonSchemaFragment): JsonSchemaFragment {
        if (schema.$ref) {
            return schema;
        }
        if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
            return this.mergeSchemas(schema.allOf);
        }
        if (schema.anyOf || schema.oneOf) {
            const variants = schema.anyOf ?? schema.oneOf ?? [];
            const nonNull = variants.find((v) => this.resolveType(v) !== 'null') ?? variants[0];
            return {...schema, ...nonNull};
        }
        return schema;
    }

    private mergeSchemas(parts: JsonSchemaFragment[]): JsonSchemaFragment {
        const merged: JsonSchemaFragment = {};
        for (const part of parts) {
            Object.assign(merged, part);
            if (part.properties) {
                merged.properties = {...merged.properties, ...part.properties};
            }
            if (part.required) {
                merged.required = [...new Set([...(merged.required ?? []), ...part.required])];
            }
        }
        return merged;
    }

    private resolveType(schema: JsonSchemaFragment): BlueprintValueKind | 'null' {
        if (Array.isArray(schema.type)) {
            const filtered = schema.type.filter((t) => t !== 'null');
            return (filtered[0] ?? 'string') as BlueprintValueKind;
        }
        if (typeof schema.type === 'string') {
            return schema.type as BlueprintValueKind;
        }
        if (schema.properties) {
            return 'object';
        }
        if (schema.items) {
            return 'array';
        }
        return 'string';
    }

    private kindFromValue(value: unknown): BlueprintValueKind {
        if (value === null) {
            return 'null';
        }
        if (typeof value === 'boolean') {
            return 'boolean';
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? 'integer' : 'number';
        }
        return 'string';
    }
}
