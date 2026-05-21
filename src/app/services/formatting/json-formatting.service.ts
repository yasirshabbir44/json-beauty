import {Injectable} from '@angular/core';
import {IJsonFormattingService} from '../../interfaces';
import {DEFAULT_FORMATTING_OPTIONS, FormattingOptions} from '../../models/json-editor.models';
import {JsonRepairResult} from '../../types/json-repair.types';
import * as JSON5 from 'json5';
import {JsonRepairService} from './json-repair.service';

const PREVIEW_SAMPLE = {
    name: 'json-beauty',
    count: 3,
    active: true,
    tags: ['demo', 'preview'],
    meta: {version: 1, locale: 'en-US'},
};

/**
 * Service for JSON formatting operations
 */
@Injectable({
    providedIn: 'root'
})
export class JsonFormattingService implements IJsonFormattingService {
    private preferences: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS };

    constructor(private jsonRepairService: JsonRepairService) {
    }

    getPreferences(): FormattingOptions {
        return { ...this.preferences };
    }

    setPreferences(options: Partial<FormattingOptions>): void {
        this.preferences = { ...this.preferences, ...options };
    }

    setIndentation(size: number, char: string): void {
        this.preferences.indentSize = size;
        this.preferences.indentChar = char === '\t' ? '\t' : ' ';
    }

    formatJson(jsonString: string, options?: Partial<FormattingOptions>): string {
        const prefs = { ...this.preferences, ...options };
        const source = (jsonString || '').trim();
        if (!source) {
            throw new Error('Nothing to format');
        }

        let jsonObj: unknown;
        try {
            jsonObj = JSON.parse(source);
        } catch {
            jsonObj = JSON5.parse(source);
        }

        if (prefs.sortKeys) {
            jsonObj = this.sortObjectKeys(jsonObj);
        }

        const indent = prefs.indentChar.repeat(prefs.indentSize);
        let result = JSON.stringify(jsonObj, null, indent);

        if (prefs.escapeUnicode) {
            result = this.escapeNonAscii(result);
        }

        if (prefs.trailingNewline && !result.endsWith('\n')) {
            result += '\n';
        }

        return result;
    }

    buildPreview(sourceJson?: string, options?: Partial<FormattingOptions>): string {
        const sample = (sourceJson || '').trim();
        const input = sample.length > 0 ? sample : JSON.stringify(PREVIEW_SAMPLE);
        try {
            return this.formatJson(input, options);
        } catch {
            return this.formatJson(JSON.stringify(PREVIEW_SAMPLE), options);
        }
    }

    enforceStrictDoubleQuotes(jsonString: string): string {
        try {
            const jsonObj = JSON.parse((jsonString || '').trim() || '{}');
            return this.formatJson(JSON.stringify(jsonObj), { sortKeys: false });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error enforcing strict double quotes: ${errorMessage}`);
        }
    }

    repairLenientJson(jsonString: string): string {
        return this.fixMyJson(jsonString).repairedJson;
    }

    /**
     * Deterministic fault-tolerant recovery for invalid JSON (Fix My JSON).
     */
    fixMyJson(jsonString: string): JsonRepairResult {
        const source = (jsonString || '').trim();
        if (!source) {
            return {
                success: false,
                repairedJson: '',
                fixesApplied: [],
                error: 'Nothing to repair'
            };
        }

        const indentSize = this.preferences.indentSize;
        const result = this.jsonRepairService.repair(source, indentSize);
        if (!result.success) {
            return result;
        }

        if (this.preferences.sortKeys) {
            try {
                const sorted = this.sortObjectKeys(JSON.parse(result.repairedJson));
                result.repairedJson = JSON.stringify(
                    sorted,
                    null,
                    this.preferences.indentChar.repeat(indentSize)
                );
            } catch {
                // keep repaired text as-is
            }
        }

        if (this.preferences.trailingNewline && !result.repairedJson.endsWith('\n')) {
            result.repairedJson += '\n';
        }

        return result;
    }

    fixInconsistentIndentation(jsonString: string): string {
        try {
            const jsonObj = JSON.parse(jsonString || '{}');
            return this.formatJson(JSON.stringify(jsonObj), { sortKeys: false });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error fixing indentation: ${errorMessage}`);
        }
    }

    beautifyJson(jsonString: string): string {
        try {
            const strictJson = this.enforceStrictDoubleQuotes(jsonString);
            return this.fixInconsistentIndentation(strictJson);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error beautifying JSON: ${errorMessage}`);
        }
    }

    minifyJson(jsonString: string): string {
        try {
            const strictJson = this.enforceStrictDoubleQuotes(jsonString);
            const jsonObj = JSON.parse(strictJson);
            let result = JSON.stringify(jsonObj);
            if (this.preferences.escapeUnicode) {
                result = this.escapeNonAscii(result);
            }
            return result;
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Error minifying JSON: ${errorMessage}`);
        }
    }

    sortObjectKeys(obj: unknown): unknown {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }

        const sortedObj: Record<string, unknown> = {};
        Object.keys(obj as Record<string, unknown>).sort().forEach(key => {
            sortedObj[key] = this.sortObjectKeys((obj as Record<string, unknown>)[key]);
        });

        return sortedObj;
    }

    private escapeNonAscii(json: string): string {
        return json.replace(/[\u0080-\uFFFF]/g, (ch) => {
            const code = ch.charCodeAt(0).toString(16).padStart(4, '0');
            return `\\u${code}`;
        });
    }
}
