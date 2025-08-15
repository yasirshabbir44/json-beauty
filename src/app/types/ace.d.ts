/**
 * Type definitions for Ace Editor
 * These definitions are not complete but cover the most commonly used functionality
 */

declare namespace AceAjax {
    export interface Ace {
        config: {
            set(key: string, value: any): void;
        };

        edit(element: HTMLElement | string): Editor;

        require(moduleName: string): any;
    }

    export interface Editor {
        session: EditSession;
        renderer: Renderer;
        commands: CommandManager;

        setTheme(theme: string): void;

        getValue(): string;

        setValue(value: string, cursorPos?: number): void;

        getSession(): EditSession;

        resize(force?: boolean): void;

        setOptions(options: EditorOptions): void;

        focus(): void;

        on(event: string, callback: Function): void;

        off(event: string, callback: Function): void;

        findNext(): void;

        findPrevious(): void;

        execCommand(command: string): void;
    }

    export interface EditSession {
        setMode(mode: string): void;

        setUseWrapMode(useWrapMode: boolean): void;

        setUseWorker(useWorker: boolean): void;

        foldAll(): void;

        unfold(): void;

        setFoldStyle(style: string): void;
    }

    export interface Renderer {
        updateFull(force?: boolean): void;
    }

    export interface CommandManager {
        addCommand(command: Command): void;
    }

    export interface Command {
        name: string;
        bindKey: {
            win: string;
            mac: string;
        };

        exec(editor: Editor): void;
    }

    export interface EditorOptions {
        enableBasicAutocompletion?: boolean;
        enableLiveAutocompletion?: boolean;
        showLineNumbers?: boolean;
        showGutter?: boolean;
        highlightActiveLine?: boolean;
        tabSize?: number;
        fontSize?: string;
        printMarginColumn?: number;
        showPrintMargin?: boolean;
        fadeFoldWidgets?: boolean;
        highlightSelectedWord?: boolean;
        displayIndentGuides?: boolean;
        showFoldWidgets?: boolean;
        foldStyle?: "manual" | "markbegin" | "markbeginend" | undefined;
        readOnly?: boolean;
    }

    export interface SearchOptions {
        needle: string;
        caseSensitive?: boolean;
        wholeWord?: boolean;
        regExp?: boolean;
        range?: Range;
        wrap?: boolean;
        preventScroll?: boolean;
    }

    export interface Range {
        start: Position;
        end: Position;
    }

    export interface Position {
        row: number;
        column: number;
    }

    export interface Search {
        new(): Search;

        set(options: SearchOptions): Search;

        find(session: EditSession): Range;
    }
}

declare const ace: AceAjax.Ace;