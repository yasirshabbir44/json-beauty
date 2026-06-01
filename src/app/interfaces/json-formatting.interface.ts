import {FormattingOptions} from '../models/json-editor.models';
import {JsonRepairResult} from '../types/json-repair.types';

/**
 * Interface for JSON formatting services
 */
export interface IJsonFormattingService {
    beautifyJson(jsonString: string): string;

    minifyJson(jsonString: string): string;

    setIndentation(size: number, char: string): void;

    getPreferences(): FormattingOptions;

    setPreferences(options: Partial<FormattingOptions>): void;

    formatJson(jsonString: string, options?: Partial<FormattingOptions>): string;

    buildPreview(sourceJson?: string, options?: Partial<FormattingOptions>): string;

    enforceStrictDoubleQuotes(jsonString: string): string;

    fixInconsistentIndentation(jsonString: string): string;

    repairLenientJson(jsonString: string): Promise<string>;

    fixMyJson(jsonString: string): Promise<JsonRepairResult>;

    sortObjectKeys(obj: unknown): unknown;
}
