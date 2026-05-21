/**
 * Structural blueprint and mock-data simulator types.
 */

import type {JsonValue} from './json.types';

export type BlueprintValueKind =
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'null'
    | 'object'
    | 'array';

export type SemanticHint =
    | 'uuid'
    | 'email'
    | 'personName'
    | 'firstName'
    | 'lastName'
    | 'username'
    | 'timestamp'
    | 'date'
    | 'url'
    | 'phone'
    | 'address'
    | 'city'
    | 'country'
    | 'postalCode'
    | 'description'
    | 'imageUrl'
    | 'status'
    | 'token'
    | 'ipv4'
    | 'currency'
    | 'version'
    | 'featureItem'
    | 'genericString'
    | 'genericNumber'
    | 'genericInteger'
    | 'genericBoolean';

/** Auto = infer realistic values from field names; custom = user-defined patterns and overrides. */
export type MockDataGenerationMode = 'auto' | 'custom';

export type MockDataStringStyle = 'placeholder' | 'lorem' | 'sequential' | 'words';

export interface MockDataCustomSettings {
    stringStyle: MockDataStringStyle;
    stringPrefix?: string;
    numberMin?: number;
    numberMax?: number;
    /** Field paths or top-level keys → fixed JSON values (merged after generation). */
    fieldOverrides?: Record<string, JsonValue>;
}

export interface BlueprintFieldContext {
    key?: string;
    path: string;
    semantic: SemanticHint;
}

export interface BlueprintNode {
    kind: BlueprintValueKind;
    context: BlueprintFieldContext;
    properties?: Record<string, BlueprintNode>;
    propertyOrder?: string[];
    itemTemplate?: BlueprintNode;
    arrayLength?: number;
    enumValues?: (string | number | boolean | null)[];
    stringFormat?: string;
    minimum?: number;
    maximum?: number;
}

export type BlueprintSource = 'json-sample' | 'json-schema';

export interface StructureBlueprint {
    version: 1;
    finalized: true;
    source: BlueprintSource;
    root: BlueprintNode;
}

export interface MockDataSimulatorOptions {
    /** Seed for deterministic output; same seed + blueprint => same dataset. */
    seed?: number | string;
    /** Override array length when blueprint does not pin a length. */
    arrayLength?: number;
    /** Pretty-print with 2-space indent (default true). */
    pretty?: boolean;
    /** Auto (smart) or custom (patterns + overrides). Default auto. */
    mode?: MockDataGenerationMode;
    custom?: MockDataCustomSettings;
}
