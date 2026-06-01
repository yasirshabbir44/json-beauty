/**
 * Lazy-load Ace editor and extensions only when the editor UI is shown.
 */

export type AceNamespace = typeof import('ace-builds');

let acePromise: Promise<AceNamespace> | null = null;
const loadedThemes = {light: false, dark: false};

export function loadAceEditorLibs(): Promise<AceNamespace> {
    if (!acePromise) {
        acePromise = (async () => {
            const ace = await import('ace-builds');
            ace.config.set('basePath', '/assets/ace');
            ace.config.setModuleUrl('ace/mode/json_worker', '/assets/ace/worker-json.js');
            await import('ace-builds/src-noconflict/mode-json');
            await import('ace-builds/src-noconflict/ext-language_tools');
            await import('ace-builds/src-noconflict/ext-searchbox');
            return ace;
        })();
    }
    return acePromise;
}

export async function ensureAceTheme(ace: AceNamespace, dark: boolean): Promise<void> {
    if (dark && !loadedThemes.dark) {
        await import('ace-builds/src-noconflict/theme-dracula');
        loadedThemes.dark = true;
    } else if (!dark && !loadedThemes.light) {
        await import('ace-builds/src-noconflict/theme-github');
        loadedThemes.light = true;
    }
}

export async function aceRequire<T>(modulePath: string): Promise<T> {
    const ace = await loadAceEditorLibs();
    return ace.require(modulePath) as T;
}
