import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {FormControl} from '@angular/forms';
import * as ace from 'ace-builds';
import {JsonValue} from '../../types/json.types';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import 'ace-builds/src-noconflict/ext-code_lens';
import 'ace-builds/src-noconflict/ext-modelist';
import 'ace-builds/src-noconflict/ext-prompt';
import 'ace-builds/src-noconflict/ext-linking';

@Component({
    selector: 'app-json-output-editor',
    templateUrl: './json-output-editor.component.html',
    styleUrls: ['./json-output-editor.component.scss']
})
export class JsonOutputEditorComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild('outputEditor', {static: false}) outputEditorElement!: ElementRef;
    @ViewChild('editorSection', {static: false}) editorSectionElement!: ElementRef;

    @Input() isDarkTheme: boolean = false;
    @Input() isMaximized: boolean = false;
    @Input() showOutputSearchBar: boolean = false;
    @Input() isValidJson: boolean = true;
    @Input() jsonOutput: FormControl = new FormControl('');
    @Input() yamlOutput: FormControl = new FormControl('');
    @Input() showTreeView: boolean = false;
    @Input() jsonTreeData: JsonValue = null;
    @Input() selectedOutputFormat: 'json' | 'yaml' = 'json';
    @Input() selectedViewMode: 'text' | 'tree' | 'table' = 'text';
    @Input() expandedNodes: Set<string> = new Set();
    @Input() treeSearchResults: string[] = [];
    @Input() showTreeSearchBar: boolean = false;
    @Input() treeSearchHighlighted: boolean = false;

    @Output() toggleMaximize = new EventEmitter<void>();
    @Output() toggleOutputFormat = new EventEmitter<void>();
    @Output() toggleViewMode = new EventEmitter<'text' | 'tree' | 'table'>();
    @Output() toggleNode = new EventEmitter<string>();
    @Output() treeSearch = new EventEmitter<string>();
    @Output() copy = new EventEmitter<void>();
    
    // Export-related event emitters
    @Output() download = new EventEmitter<void>();
    @Output() downloadText = new EventEmitter<void>();
    @Output() convertToCsv = new EventEmitter<void>();
    @Output() convertToXml = new EventEmitter<void>();
    @Output() share = new EventEmitter<void>();

    outputEditor: AceAjax.Editor | null = null;
    isFullScreen: boolean = false;

    constructor(private renderer: Renderer2) {
    }

    ngOnInit(): void {
        // Initialize will be done in ngAfterViewInit
    }

    ngAfterViewInit(): void {
        // Initialize output editor after view has been initialized
        setTimeout(() => {
            this.initializeOutputEditor();
        });
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

    ngOnChanges(changes: SimpleChanges): void {
        // Update editor theme when isDarkTheme changes
        if (changes['isDarkTheme'] && this.outputEditor) {
            this.updateOutputEditorTheme();
        }

        // Handle changes to selectedOutputFormat
        if (changes['selectedOutputFormat']) {
            // If switching to JSON format, ensure the editor is initialized and visible
            if (this.selectedOutputFormat === 'json' && !this.showTreeView) {
                // If editor isn't initialized yet, initialize it
                if (!this.outputEditor) {
                    setTimeout(() => this.initializeOutputEditor(), 0);
                } else {
                    // If already initialized, ensure it's properly sized and updated
                    if (this.outputEditor) {
                        this.updateEditorContentSafely(this.jsonOutput.value);
                    }
                }
            }
        }

        // Update editor content when jsonOutput changes
        if (changes['jsonOutput'] && this.outputEditor && !this.showTreeView && this.selectedOutputFormat === 'json') {
            try {
                this.outputEditor.setValue(this.jsonOutput.value || '', -1);
                this.outputEditor.renderer.updateFull(true);

                // Ensure editor is properly sized after content update
                this.resizeEditorSafely();
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error(`Error updating editor content: ${errorMessage}`);
            }
        }

        // Handle changes to showTreeView
        if (changes['showTreeView']) {
            // If switching from tree view to JSON view, ensure editor is initialized and visible
            if (!this.showTreeView && this.selectedOutputFormat === 'json') {
                // Short delay to allow DOM to update before initializing/updating editor
                setTimeout(() => {
                    if (!this.outputEditor) {
                        this.initializeOutputEditor();
                    } else {
                        this.outputEditor.setValue(this.jsonOutput.value || '', -1);
                        this.outputEditor.renderer.updateFull(true);
                        this.resizeEditorSafely(0);
                    }
                }, 100);
            }
        }
    }

    /**
     * Initializes the output editor with proper configuration
     */
    initializeOutputEditor(): void {
        // Check if the output editor element is available
        if (!this.outputEditorElement || !this.outputEditorElement.nativeElement) {
            // If not available and we're in JSON mode without tree view, try again after a delay
            if (!this.showTreeView && this.selectedOutputFormat === 'json') {
                setTimeout(() => {
                    this.initializeOutputEditor();
                }, 100);
            }
            return;
        }

        // If the output editor is already initialized, don't initialize it again
        if (this.outputEditor) {
            return;
        }

        // Constants for error messages
        const EDITOR_INIT_ERROR = 'Failed to initialize editor';
        const ACE_CONFIG_ERROR = 'Failed to configure Ace editor';

        try {
            // Set the basePath for ace editor to load its modes, themes, and extensions
            ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.32.0/src-noconflict/');

            // Initialize the output editor
            this.outputEditor = ace.edit(this.outputEditorElement.nativeElement);

            if (!this.outputEditor) {
                throw new Error(EDITOR_INIT_ERROR);
            }

            this.updateOutputEditorTheme();
            this.outputEditor.session.setMode('ace/mode/json');
            this.outputEditor.setOptions({
                readOnly: true,
                showLineNumbers: true,
                showGutter: true,
                highlightActiveLine: false,
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
            const session = this.outputEditor.getSession();
            session.setFoldStyle('markbegin');
            session.setUseWrapMode(true);

            // Add fold/unfold commands to the editor
            this.outputEditor.commands.addCommand({
                name: 'foldAll',
                bindKey: {win: 'Ctrl-Alt-0', mac: 'Command-Option-0'},
                exec: (editor: AceAjax.Editor) => {
                    editor.getSession().foldAll();
                }
            });

            this.outputEditor.commands.addCommand({
                name: 'unfoldAll',
                bindKey: {win: 'Ctrl-Alt-Shift-0', mac: 'Command-Option-Shift-0'},
                exec: (editor: AceAjax.Editor) => {
                    editor.getSession().unfold();
                }
            });

            // Disable syntax error highlighting for output editor
            this.outputEditor.getSession().setUseWorker(false);

            // Force initial render
            this.outputEditor.renderer.updateFull(true);

            // Update the output if we have valid JSON
            if (this.isValidJson && this.jsonOutput.value) {
                this.outputEditor.setValue(this.jsonOutput.value, -1);

                // Ensure editor is visible and properly sized
                this.resizeEditorSafely();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`${EDITOR_INIT_ERROR}: ${errorMessage}`);
        }
    }

    /**
     * Updates the editor theme based on the isDarkTheme setting
     * Switches between dracula (dark) and github (light) themes
     */
    updateOutputEditorTheme(): void {
        if (this.outputEditor) {
            this.outputEditor.setTheme(this.isDarkTheme ? 'ace/theme/dracula' : 'ace/theme/github');
        }
    }

    /**
     * Toggles the maximized state of the output section
     * Emits an event to the parent component to handle the UI changes
     */
    toggleOutputMaximize(): void {
        if (this.isFullScreen) {
            this.exitFullScreen();
        } else {
            this.enterFullScreen();
        }
    }

    /**
     * Toggles the output format between JSON and YAML
     */
    onToggleOutputFormat(): void {
        this.toggleOutputFormat.emit();
    }

    /**
     * Handles toggling between different view modes (text, tree, table)
     */
    onToggleViewMode(): void {
        this.toggleViewMode.emit(this.selectedViewMode);
    }

    /**
     * Toggles a node's expanded state in the tree view
     * @param nodeId The ID of the node to toggle
     */
    onToggleNode(nodeId: string): void {
        this.toggleNode.emit(nodeId);
    }

    /**
     * Searches for text in the output editor
     * @param searchText The text to search for
     */
    searchInJson(searchText: string): void {
        if (!searchText) {
            this.clearSearch();
            return;
        }

        if (this.outputEditor) {
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

            const range = searchInstance.find(this.outputEditor.getSession());
            if (range) {
                this.outputEditor.focus();
            }
        }
    }

    /**
     * Finds the next occurrence of the search text
     */
    findNext(): void {
        if (this.outputEditor) {
            this.outputEditor.findNext();
        }
    }

    /**
     * Finds the previous occurrence of the search text
     */
    findPrevious(): void {
        if (this.outputEditor) {
            this.outputEditor.findPrevious();
        }
    }

    /**
     * Clears the search highlighting
     */
    clearSearch(): void {
        if (this.outputEditor) {
            this.outputEditor.execCommand('clearSelection');
        }
    }

    /**
     * Gets the keys of an object
     * @param obj The object to get keys from
     * @returns Array of keys
     */
    getObjectKeys(obj: any): string[] {
        if (!obj || typeof obj !== 'object') return [];
        return Object.keys(obj);
    }

    /**
     * Checks if a value is expandable (object or array)
     * @param value The value to check
     * @returns True if the value is expandable
     */
    isExpandable(value: any): boolean {
        return (this.isObject(value) || this.isArray(value)) &&
            (this.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);
    }

    /**
     * Checks if a node is expanded
     * @param nodeId The ID of the node to check
     * @returns True if the node is expanded
     */
    isNodeExpanded(nodeId: string): boolean {
        return this.expandedNodes.has(nodeId);
    }

    /**
     * Checks if a value is a string
     * @param value The value to check
     * @returns True if the value is a string
     */
    isString(value: any): boolean {
        return typeof value === 'string';
    }

    /**
     * Tree View Helper Methods
     */

    /**
     * Checks if a value is a number
     * @param value The value to check
     * @returns True if the value is a number
     */
    isNumber(value: any): boolean {
        return typeof value === 'number';
    }

    /**
     * Checks if a value is a boolean
     * @param value The value to check
     * @returns True if the value is a boolean
     */
    isBoolean(value: any): boolean {
        return typeof value === 'boolean';
    }

    /**
     * Checks if a value is an array
     * @param value The value to check
     * @returns True if the value is an array
     */
    isArray(value: any): boolean {
        return Array.isArray(value);
    }

    /**
     * Checks if a value is an object
     * @param value The value to check
     * @returns True if the value is an object
     */
    isObject(value: any): boolean {
        return value !== null && typeof value === 'object';
    }

    /**
     * Formats a value for display in the tree view
     * @param value The value to format
     * @returns The formatted value
     */
    formatValue(value: any): string {
        if (value === null) return 'null';
        if (value === undefined) return 'undefined';
        if (this.isString(value)) return `"${value}"`;
        return String(value);
    }

    /**
     * Searches in the JSON tree view
     * @param searchText The text to search for in the tree
     */
    searchInTree(searchText: string): void {
        this.treeSearch.emit(searchText);
    }

    /**
     * Clears the tree search highlighting
     */
    clearTreeSearch(): void {
        this.treeSearch.emit('');
    }

    /**
     * Utility method to safely resize the editor after a short delay
     * @param delay Time in milliseconds to wait before resizing
     */
    private resizeEditorSafely(delay: number = 100): void {
        if (!this.outputEditor) return;

        setTimeout(() => {
            if (this.outputEditor) {
                this.outputEditor.resize();
            }
        }, delay);
    }

    /**
     * Utility method to safely update the editor content and resize
     * @param content The content to set in the editor
     * @param cursorPos The cursor position after update (-1 for end of document)
     */
    private updateEditorContentSafely(content: string, cursorPos: number = -1): void {
        if (!this.outputEditor) return;

        try {
            this.outputEditor.setValue(content || '', cursorPos);
            this.outputEditor.renderer.updateFull(true);
            this.resizeEditorSafely();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error updating editor content: ${errorMessage}`);
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
        setTimeout(() => {
            if (this.outputEditor) {
                this.outputEditor.resize();
            }
        }, 100);
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
}
