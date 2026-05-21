/**
 * JSON beautify / output preferences
 */
export interface FormattingOptions {
    indentSize: number;
    indentChar: ' ' | '\t';
    sortKeys: boolean;
    trailingNewline: boolean;
    escapeUnicode: boolean;
}

export const DEFAULT_FORMATTING_OPTIONS: FormattingOptions = {
    indentSize: 2,
    indentChar: ' ',
    sortKeys: false,
    trailingNewline: true,
    escapeUnicode: false,
};

/**
 * Interface for schema validation result
 */
export interface SchemaValidationResult {
    isValid: boolean;
    errors: SchemaValidationError[];
}

/**
 * Interface for schema validation error
 */
export interface SchemaValidationError {
    message: string;
    dataPath?: string;
}

/**
 * Interface for keyboard shortcut
 */
export interface KeyboardShortcut {
    key: string;
    action: string;
}

/**
 * Interface for JSON diff result
 */
export interface JsonDiffResult {
    delta: any;
    htmlDiff: string;
    hasChanges: boolean;
}

/**
 * Enum for output format
 */
export enum OutputFormat {
    JSON = 'json',
    YAML = 'yaml'
}
