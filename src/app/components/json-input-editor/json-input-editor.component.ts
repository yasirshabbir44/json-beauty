import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-code_lens';
import 'ace-builds/src-noconflict/ext-modelist';
import 'ace-builds/src-noconflict/ext-prompt';
import 'ace-builds/src-noconflict/ext-linking';
import {JsonService} from '../../services/json.service';
import {InputSanitizationService} from '../../services/security/input-sanitization.service';
import {SecurityUtilsService} from '../../services/security/security-utils.service';

@Component({
    selector: 'app-json-input-editor',
    templateUrl: './json-input-editor.component.html',
    styleUrls: ['./json-input-editor.component.scss']
})
export class JsonInputEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('editor', {static: true}) editorElement!: ElementRef;
    @ViewChild('editorSection', {static: true}) editorSectionElement!: ElementRef;
    @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

    @Input() isDarkTheme: boolean = false;
    @Input() isMaximized: boolean = false;
    @Input() isValidJson: boolean = true;
    @Input() errorMessage: string = '';

    @Output() jsonInputChange = new EventEmitter<string>();
    @Output() toggleMaximize = new EventEmitter<void>();
    @Output() cursorPositionChange = new EventEmitter<{ line: number; column: number }>();

    editor: AceAjax.Editor | null = null;
    jsonInput = new FormControl('');
    isFullScreen: boolean = false;

    // Constants for error messages
    private readonly EDITOR_INIT_ERROR = 'Failed to initialize editor';
    private readonly EDITOR_NOT_INITIALIZED = 'Editor is not initialized';

    constructor(
        private jsonService: JsonService,
        private sanitizationService: InputSanitizationService,
        private securityUtils: SecurityUtilsService,
        private renderer: Renderer2
    ) {
    }

    ngOnInit(): void {
        this.initializeEditor();
    }

    ngAfterViewInit(): void {
        // Force initial render
        if (this.editor) {
            this.editor.renderer.updateFull(true);
        }
    }
    
    @HostListener('document:keydown.escape', ['$event'])
    onEscapeKey(event: KeyboardEvent): void {
        if (this.isFullScreen) {
            this.exitFullScreen();
        }
    }

    @HostListener('document:fullscreenchange', ['$event'])
    @HostListener('document:webkitfullscreenchange', ['$event'])
    @HostListener('document:mozfullscreenchange', ['$event'])
    @HostListener('document:MSFullscreenChange', ['$event'])
    onFullScreenChange(): void {
        // Handle different browser implementations of fullscreen API
        interface FullScreenDocument extends Document {
            webkitFullscreenElement?: Element;
            mozFullScreenElement?: Element;
            msFullscreenElement?: Element;
        }

        const doc = document as FullScreenDocument;
        this.isFullScreen = !!(doc.fullscreenElement ||
            doc.webkitFullscreenElement ||
            doc.mozFullScreenElement ||
            doc.msFullscreenElement);

        // Resize editor when exiting fullscreen
        if (!this.isFullScreen) {
            this.resizeEditorSafely();
        }
    }
    
    /**
     * Utility method to safely resize the editor after a short delay
     * @param delay Time in milliseconds to wait before resizing
     */
    private resizeEditorSafely(delay: number = 100): void {
        if (!this.editor) return;

        setTimeout(() => {
            if (this.editor) {
                this.editor.resize();
            }
        }, delay);
    }

    initializeEditor(): void {
        try {
            ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.32.0/src-noconflict/');

            // Initialize input editor
            this.editor = ace.edit(this.editorElement.nativeElement);
            this.updateEditorTheme();

            if (!this.editor) {
                console.error(this.EDITOR_INIT_ERROR);
                return;
            }

            this.editor.session.setMode('ace/mode/json');
            this.editor.setOptions({
                enableBasicAutocompletion: true,
                enableLiveAutocompletion: true,
                showLineNumbers: true,
                showGutter: true,
                highlightActiveLine: true,
                tabSize: 2,
                fontSize: '14px',
                printMarginColumn: 120,
                showPrintMargin: false,
                fadeFoldWidgets: false,
                highlightSelectedWord: true,
                displayIndentGuides: true,
                // Enable code folding
                showFoldWidgets: true,
                foldStyle: 'markbegin'
            });

            // Set up the session for folding
            const session = this.editor.getSession();
            session.setFoldStyle('markbegin');
            session.setUseWrapMode(true);

            // Add fold/unfold commands to the editor
            this.editor.commands.addCommand({
                name: 'foldAll',
                bindKey: {win: 'Ctrl-Alt-0', mac: 'Command-Option-0'},
                exec: (editor: AceAjax.Editor) => {
                    editor.getSession().foldAll();
                }
            });

            this.editor.commands.addCommand({
                name: 'unfoldAll',
                bindKey: {win: 'Ctrl-Alt-Shift-0', mac: 'Command-Option-Shift-0'},
                exec: (editor: AceAjax.Editor) => {
                    editor.getSession().unfold();
                }
            });

            // Enable real-time syntax error highlighting
            this.editor.getSession().setUseWorker(true);

            this.editor.on('change', () => {
                if (this.editor) {
                    this.jsonInput.setValue(this.editor.getValue());
                    this.jsonInputChange.emit(this.editor.getValue());
                }
            });

            const ed = this.editor as unknown as { selection: { on: (ev: string, fn: () => void) => void } };
            ed.selection.on('changeCursor', this.boundEmitCursor);
            this.emitCursorPosition();
        } catch (error) {
            console.error(`${this.EDITOR_INIT_ERROR}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    updateEditorTheme(): void {
        if (this.editor) {
            this.editor.setTheme(this.isDarkTheme ? 'ace/theme/dracula' : 'ace/theme/github');
        }
    }

    /**
     * Sets the value of the editor
     * @param value The value to set
     */
    setValue(value: string): void {
        if (this.editor) {
            this.editor.setValue(value, -1);
        }
    }

    /**
     * Gets the value of the editor
     * @returns The current value of the editor
     */
    getValue(): string {
        return this.editor ? this.editor.getValue() : '';
    }

    /**
     * Clears the editor
     */
    clearEditor(): void {
        if (this.editor) {
            this.editor.setValue('', -1);
            this.jsonInput.setValue('');
            this.jsonInputChange.emit('');
        }
    }

    ngOnDestroy(): void {
        if (this.editor) {
            const ed = this.editor as unknown as { selection: { off: (ev: string, fn: () => void) => void } };
            ed.selection.off('changeCursor', this.boundEmitCursor);
        }
    }

    /** Opens the hidden file picker (used from parent menus). */
    openFilePicker(): void {
        this.fileInputRef?.nativeElement?.click();
    }

    /** Exposes the Ace instance for scroll sync and parent-driven search. */
    getAceEditor(): AceAjax.Editor | null {
        return this.editor;
    }

    private readonly boundEmitCursor = (): void => this.emitCursorPosition();

    private emitCursorPosition(): void {
        if (!this.editor) {
            return;
        }
        const pos = (this.editor as unknown as { getCursorPosition: () => { row: number; column: number } }).getCursorPosition();
        this.cursorPositionChange.emit({ line: pos.row + 1, column: pos.column + 1 });
    }
    
    /**
     * Imports JSON from a file
     * @param event The file input change event
     */
    importFile(event: any): void {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file before processing
        const allowedTypes = ['application/json', 'text/plain', 'text/json', 'application/x-javascript'];
        const maxFileSize = 5 * 1024 * 1024; // 5MB
        
        if (!this.securityUtils.validateFile(file, allowedTypes, maxFileSize)) {
            console.error(`Invalid file: Only JSON files up to 5MB are allowed`);
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;

                // Sanitize the file content before processing
                const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'json';
                const sanitizedContent = this.sanitizationService.sanitizeFileContent(content, fileExtension);

                // Try to parse the sanitized content to validate it's JSON
                JSON.parse(sanitizedContent);

                // Set the input editor value
                this.setValue(sanitizedContent);
                this.jsonInput.setValue(sanitizedContent);
                this.jsonInputChange.emit(sanitizedContent);
            } catch (error) {
                console.error('Error importing file:', error instanceof Error ? error.message : String(error));
            }

            // Reset the file input so the same file can be selected again
            event.target.value = '';
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    /**
     * Toggles the maximized state of the input section
     */
    toggleInputMaximize(): void {
        if (this.isFullScreen) {
            this.exitFullScreen();
        } else {
            this.enterFullScreen();
        }
    }
    
    /**
     * Enter full screen mode
     */
    private enterFullScreen(): void {
        const element = this.editorSectionElement.nativeElement;

        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
            (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
            (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
            (element as any).msRequestFullscreen();
        }

        // Add fullscreen class for styling
        this.renderer.addClass(element, 'fullscreen-mode');

        // Resize editor after entering fullscreen
        this.resizeEditorSafely();
    }

    /**
     * Exit full screen mode
     */
    private exitFullScreen(): void {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
        }

        // Remove fullscreen class
        const element = this.editorSectionElement.nativeElement;
        this.renderer.removeClass(element, 'fullscreen-mode');
    }

    /**
     * Searches for text in the editor
     * @param searchText The text to search for
     */
    searchInJson(searchText: string): void {
        if (!searchText) {
            this.clearSearch();
            return;
        }

        if (this.editor) {
            // Use Ace editor's search functionality
            const search = ace.require('ace/search').Search;
            const searchInstance = new search();

            searchInstance.set({
                needle: searchText,
                caseSensitive: false,
                wholeWord: false,
                regExp: false,
                range: null,
                wrap: true,
                preventScroll: false
            });

            const range = searchInstance.find(this.editor.getSession());
            if (range) {
                this.editor.focus();
            }
        }
    }

    /**
     * Finds the next occurrence of the search text
     */
    findNext(): void {
        if (this.editor) {
            this.editor.findNext();
        }
    }

    /**
     * Finds the previous occurrence of the search text
     */
    findPrevious(): void {
        if (this.editor) {
            this.editor.findPrevious();
        }
    }

    /**
     * Clears the search highlighting
     */
    clearSearch(): void {
        if (this.editor) {
            this.editor.execCommand('clearSelection');
        }
    }

    /**
     * Selects a range by UTF-16 string offsets and scrolls it into view (for search / replace panel).
     */
    revealDocumentOffsets(startOffset: number, length: number): void {
        if (!this.editor || startOffset < 0 || length < 0) {
            return;
        }

        const editor = this.editor as any;
        const RangeCtor = ace.require('ace/range').Range;
        const doc = editor.session.getDocument();
        const textLen = doc.getValue().length;
        const safeStart = Math.min(startOffset, textLen);
        const safeEnd = Math.min(safeStart + length, textLen);

        const start = doc.indexToPosition(safeStart, 0);
        const end = doc.indexToPosition(safeEnd, 0);
        const range = new RangeCtor(start.row, start.column, end.row, end.column);

        editor.selection.setRange(range);
        editor.renderer.scrollSelectionIntoView(editor.selection.anchor, editor.selection.cursor, 0.5);
        editor.focus();
    }
}