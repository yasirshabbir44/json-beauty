import {DEFAULT_FORMATTING_OPTIONS, FormattingOptions} from '../models/json-editor.models';

export interface FormattingPreset {
    id: string;
    label: string;
    description: string;
    icon: string;
    options: FormattingOptions;
}

export const FORMATTING_PRESETS: FormattingPreset[] = [
    {
        id: 'readable',
        label: 'Readable',
        description: '2-space indent, natural key order',
        icon: 'menu_book',
        options: {...DEFAULT_FORMATTING_OPTIONS},
    },
    {
        id: 'wide',
        label: 'Wide',
        description: '4-space indent for spacious layouts',
        icon: 'unfold_more',
        options: {...DEFAULT_FORMATTING_OPTIONS, indentSize: 4},
    },
    {
        id: 'tabs',
        label: 'Tabs',
        description: 'Tab indentation for editor-native files',
        icon: 'keyboard_tab',
        options: {...DEFAULT_FORMATTING_OPTIONS, indentChar: '\t', indentSize: 2},
    },
    {
        id: 'diff-ready',
        label: 'Diff-ready',
        description: 'Sorted keys for stable comparisons',
        icon: 'compare_arrows',
        options: {...DEFAULT_FORMATTING_OPTIONS, sortKeys: true},
    },
    {
        id: 'compact',
        label: 'Compact',
        description: 'No trailing newline, minimal file footprint',
        icon: 'compress',
        options: {...DEFAULT_FORMATTING_OPTIONS, trailingNewline: false},
    },
    {
        id: 'ascii-safe',
        label: 'ASCII-safe',
        description: 'Escape non-ASCII as \\uXXXX sequences',
        icon: 'language',
        options: {...DEFAULT_FORMATTING_OPTIONS, escapeUnicode: true},
    },
];

export function formattingOptionsEqual(a: FormattingOptions, b: FormattingOptions): boolean {
    return (
        a.indentSize === b.indentSize &&
        a.indentChar === b.indentChar &&
        a.sortKeys === b.sortKeys &&
        a.trailingNewline === b.trailingNewline &&
        a.escapeUnicode === b.escapeUnicode
    );
}

export function findMatchingPresetId(options: FormattingOptions): string | null {
    const match = FORMATTING_PRESETS.find(preset =>
        formattingOptionsEqual(options, preset.options)
    );
    return match?.id ?? null;
}
