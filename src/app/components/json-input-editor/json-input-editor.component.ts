import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
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
export class JsonInputEditorComponent implements OnInit, AfterViewInit {
    @ViewChild('editor', {static: true}) editorElement!: ElementRef;

    @Input() isDarkTheme: boolean = false;
    @Input() isMaximized: boolean = false;
    @Input() showInputSearchBar: boolean = false;
    @Input() isValidJson: boolean = true;
    @Input() errorMessage: string = '';

    @Output() jsonInputChange = new EventEmitter<string>();
    @Output() toggleMaximize = new EventEmitter<void>();
    
    // Action outputs
    @Output() beautify = new EventEmitter<void>();
    @Output() minify = new EventEmitter<void>();
    @Output() clear = new EventEmitter<void>();
    @Output() import = new EventEmitter<Event>();

    editor: AceAjax.Editor | null = null;
    jsonInput = new FormControl('');

    // Constants for error messages
    private readonly EDITOR_INIT_ERROR = 'Failed to initialize editor';
    private readonly EDITOR_NOT_INITIALIZED = 'Editor is not initialized';

    constructor(
        private jsonService: JsonService,
        private sanitizationService: InputSanitizationService,
        private securityUtils: SecurityUtilsService
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
                fontSize: '15px',
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
            this.clear.emit();
        }
    }
    
    /**
     * Beautifies the JSON in the editor
     */
    beautifyJson(): void {
        try {
            if (this.editor) {
                const beautified = this.jsonService.beautifyJson(this.getValue() || '{}');
                this.setValue(beautified);
                this.jsonInput.setValue(beautified);
                this.jsonInputChange.emit(beautified);
                this.beautify.emit();
            }
        } catch (e: any) {
            console.error('Error beautifying JSON:', e.message);
        }
    }
    
    /**
     * Minifies the JSON in the editor
     */
    minifyJson(): void {
        try {
            if (this.editor) {
                const minified = this.jsonService.minifyJson(this.getValue() || '{}');
                this.setValue(minified);
                this.jsonInput.setValue(minified);
                this.jsonInputChange.emit(minified);
                this.minify.emit();
            }
        } catch (e: any) {
            console.error('Error minifying JSON:', e.message);
        }
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
                this.import.emit(event);
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
        this.toggleMaximize.emit();

        // Resize the editor after the UI has updated
        setTimeout(() => {
            if (this.editor) {
                this.editor.resize();
            }
        }, 100);
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
}