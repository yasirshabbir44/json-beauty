/** Keyboard shortcuts shown in the editor dialog and on the landing page. */
export interface KeyboardShortcutItem {
    key: string;
    action: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcutItem[] = [
    {key: 'Ctrl / Cmd + F', action: 'Show or hide floating find bar'},
    {key: 'Ctrl / Cmd + Shift + F', action: 'Show or hide Search & Replace panel'},
    {key: 'Ctrl + B', action: 'Beautify JSON'},
    {key: 'Ctrl + M', action: 'Minify JSON'},
    {key: 'Ctrl + L', action: 'Lint and fix JSON'},
    {key: 'Ctrl + C', action: 'Copy to clipboard'},
    {key: 'Ctrl + S', action: 'Download JSON'},
    {key: 'Ctrl + D', action: 'Clear editor'},
    {key: 'Ctrl + K', action: 'Show or hide keyboard shortcuts'},
    {key: 'Ctrl + 1', action: 'Maximize or minimize input panel'},
    {key: 'Ctrl + 2', action: 'Maximize or minimize output panel'},
    {key: 'Ctrl + Alt + 0', action: 'Fold all code'},
    {key: 'Ctrl + Alt + Shift + 0', action: 'Unfold all code'},
];
