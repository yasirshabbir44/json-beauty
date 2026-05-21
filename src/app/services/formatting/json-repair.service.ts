import {Injectable} from '@angular/core';
import {jsonrepair} from 'jsonrepair';
import * as JSON5 from 'json5';
import {JsonRepairFixKind, JsonRepairResult} from '../../types/json-repair.types';

/**
 * Deterministic, fault-tolerant JSON recovery.
 * Uses an error-tolerant tokenizer (jsonrepair) for strict RFC JSON, with JSON5 as a fallback
 * for comments and other relaxed syntax.
 */
@Injectable({
    providedIn: 'root'
})
export class JsonRepairService {
    /**
     * Repairs invalid JSON into strict, parseable RFC JSON.
     * Same input always yields the same repaired output (deterministic).
     */
    repair(jsonString: string, indentSize = 2): JsonRepairResult {
        const source = (jsonString ?? '').trim();
        if (!source) {
            return {
                success: false,
                repairedJson: '',
                fixesApplied: [],
                error: 'Nothing to repair'
            };
        }

        if (this.isStrictJson(source)) {
            return {
                success: true,
                repairedJson: this.formatParsed(JSON.parse(source), indentSize),
                fixesApplied: []
            };
        }

        const detectedFixes = this.detectLikelyIssues(source);

        try {
            const repairedText = jsonrepair(source);
            JSON.parse(repairedText);
            const fixesApplied = this.mergeFixKinds(detectedFixes, this.inferFixesFromDiff(source, repairedText));
            return {
                success: true,
                repairedJson: this.formatParsed(JSON.parse(repairedText), indentSize),
                fixesApplied
            };
        } catch {
            // jsonrepair could not recover — try JSON5 (comments, relaxed keys, etc.)
        }

        try {
            const parsed = JSON5.parse(source);
            const fixesApplied = this.mergeFixKinds(detectedFixes, ['json5-syntax']);
            return {
                success: true,
                repairedJson: this.formatParsed(parsed, indentSize),
                fixesApplied
            };
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            return {
                success: false,
                repairedJson: '',
                fixesApplied: [],
                error: errorMessage
            };
        }
    }

    /** Human-readable labels for repair categories (UI / snackbars). */
    describeFixes(fixes: JsonRepairFixKind[]): string[] {
        const labels: Record<JsonRepairFixKind, string> = {
            'missing-quotes': 'Added missing quotes around keys and values',
            'single-quotes': 'Converted single-quoted strings to double quotes',
            'trailing-commas': 'Removed invalid trailing commas',
            'unclosed-brackets': 'Closed unclosed brackets or braces',
            'json5-syntax': 'Normalized JSON5 syntax (comments, unquoted keys) to strict JSON',
            'formatting': 'Reformatted to consistent indentation'
        };
        return fixes.map((kind) => labels[kind]);
    }

    private isStrictJson(source: string): boolean {
        try {
            JSON.parse(source);
            return true;
        } catch {
            return false;
        }
    }

    private formatParsed(value: unknown, indentSize: number): string {
        return JSON.stringify(value, null, indentSize);
    }

    private detectLikelyIssues(source: string): JsonRepairFixKind[] {
        const fixes: JsonRepairFixKind[] = [];

        if (this.hasUnquotedKeys(source)) {
            fixes.push('missing-quotes');
        }
        if (this.hasSingleQuotedStrings(source)) {
            fixes.push('single-quotes');
        }
        if (/,(\s*[\]}])/.test(source)) {
            fixes.push('trailing-commas');
        }
        if (this.hasUnclosedBrackets(source)) {
            fixes.push('unclosed-brackets');
        }
        if (/\/\/|\/\*|\bundefined\b/.test(source)) {
            fixes.push('json5-syntax');
        }

        return fixes;
    }

    private inferFixesFromDiff(before: string, after: string): JsonRepairFixKind[] {
        const fixes: JsonRepairFixKind[] = [];

        if (before !== after) {
            if (this.hasUnquotedKeys(before) && !this.hasUnquotedKeys(after)) {
                fixes.push('missing-quotes');
            }
            if (this.hasSingleQuotedStrings(before) && !this.hasSingleQuotedStrings(after)) {
                fixes.push('single-quotes');
            }
            if (/,(\s*[\]}])/.test(before) && !/,(\s*[\]}])/.test(after)) {
                fixes.push('trailing-commas');
            }
            if (this.hasUnclosedBrackets(before) && !this.hasUnclosedBrackets(after)) {
                fixes.push('unclosed-brackets');
            }
        }

        return fixes;
    }

    private mergeFixKinds(...groups: JsonRepairFixKind[][]): JsonRepairFixKind[] {
        const order: JsonRepairFixKind[] = [
            'missing-quotes',
            'single-quotes',
            'trailing-commas',
            'unclosed-brackets',
            'json5-syntax',
            'formatting'
        ];
        const seen = new Set<JsonRepairFixKind>();
        for (const group of groups) {
            for (const kind of group) {
                seen.add(kind);
            }
        }
        return order.filter((kind) => seen.has(kind));
    }

    private hasUnquotedKeys(source: string): boolean {
        return /[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(source);
    }

    private hasSingleQuotedStrings(source: string): boolean {
        return /'(?:\\.|[^'\\])*'/.test(source);
    }

    private hasUnclosedBrackets(source: string): boolean {
        let depthCurly = 0;
        let depthSquare = 0;
        let inString = false;
        let escaped = false;

        for (let i = 0; i < source.length; i++) {
            const ch = source[i];

            if (inString) {
                if (escaped) {
                    escaped = false;
                    continue;
                }
                if (ch === '\\') {
                    escaped = true;
                    continue;
                }
                if (ch === '"') {
                    inString = false;
                }
                continue;
            }

            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{') {
                depthCurly++;
            } else if (ch === '}') {
                depthCurly = Math.max(0, depthCurly - 1);
            } else if (ch === '[') {
                depthSquare++;
            } else if (ch === ']') {
                depthSquare = Math.max(0, depthSquare - 1);
            }
        }

        return depthCurly > 0 || depthSquare > 0;
    }
}
