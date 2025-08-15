import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {JsonService} from '../../services/json.service';
import {VersionHistoryService} from '../../services/history/version-history.service';
import {InputSanitizationService} from '../../services/security/input-sanitization.service';
import {SecurityUtilsService} from '../../services/security/security-utils.service';
import {ShareDialogComponent} from '../share-dialog/share-dialog.component';
import {JsonInputEditorComponent} from '../json-input-editor/json-input-editor.component';
import {JsonOutputEditorComponent} from '../json-output-editor/json-output-editor.component';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

@Component({
    selector: 'app-json-editor',
    templateUrl: './json-editor.component.html',
    styleUrls: ['./json-editor.component.scss']
})
/**
 * Main JSON Editor component that orchestrates the interaction between child components:
 * - JsonInputEditorComponent: Handles the input JSON editor
 * - JsonOutputEditorComponent: Handles the output JSON/YAML display and tree view
 * - JsonToolbarComponent: Provides action buttons for JSON operations
 * - JsonDialogsComponent: Manages dialog windows for keyboard shortcuts, formatting options, etc.
 * - JsonStatusComponent: Displays status information about the JSON
 * - JsonPathsComponent: Shows JSON paths when enabled
 *
 * This component maintains the state and coordinates data flow between the child components.
 */
export class JsonEditorComponent implements OnInit, AfterViewInit {
    @ViewChild(JsonInputEditorComponent, {static: false}) jsonInputEditor!: JsonInputEditorComponent;
    @ViewChild(JsonOutputEditorComponent, {static: false}) jsonOutputEditor!: JsonOutputEditorComponent;
    jsonInput = new FormControl('');
    jsonOutput = new FormControl('');
    isValidJson = true;
    errorMessage = '';
    showKeyboardShortcuts = false;
    showFeatures = false;
    isDarkTheme = false;
    showTreeView = false;
    jsonTreeData: any = null;
    expandedNodes: Set<string> = new Set();
    showFormattingOptions = false;
    indentSize = 2;
    indentChar = ' ';

    // Keyboard shortcuts
    keyboardShortcuts = [
        {key: 'Ctrl + F', action: 'Show/Hide Search Bar'},
        {key: 'Ctrl + B', action: 'Beautify JSON'},
        {key: 'Ctrl + M', action: 'Minify JSON'},
        {key: 'Ctrl + L', action: 'Lint & Fix JSON'},
        {key: 'Ctrl + C', action: 'Copy to Clipboard'},
        {key: 'Ctrl + S', action: 'Download JSON'},
        {key: 'Ctrl + D', action: 'Clear Editor'},
        {key: 'Ctrl + K', action: 'Show/Hide Keyboard Shortcuts'},
        {key: 'Ctrl + 1', action: 'Maximize/Minimize Input'},
        {key: 'Ctrl + 2', action: 'Maximize/Minimize Output'},
        {key: 'Ctrl + Alt + 0', action: 'Fold All Code'},
        {key: 'Ctrl + Alt + Shift + 0', action: 'Unfold All Code'}
    ];

    // Properties for new features
    yamlOutput = new FormControl('');
    jsonPaths: string[] = [];
    showJsonPaths = false;
    showYamlOutput = false;
    selectedOutputFormat: 'json' | 'yaml' = 'json';
    selectedViewMode: 'text' | 'tree' | 'table' = 'text';

    // Tree search properties
    treeSearchResults: string[] = [];
    treeSearchHighlighted: boolean = false;

    // Search bar visibility properties
    showInputSearchBar: boolean = false;
    showOutputSearchBar: boolean = false;
    showTreeSearchBar: boolean = false;

    // Schema validation properties
    schemaInput = new FormControl('');
    showSchemaEditor = false;
    schemaValidationResult: { isValid: boolean, errors: any[] } | null = null;

    // JSON diff comparison properties
    compareJsonInput = new FormControl('');
    showJsonCompare = false;
    jsonDiffResult: { delta: any, htmlDiff: string, hasChanges: boolean } | null = null;

    // JSON path query properties
    jsonPathQuery = new FormControl('');
    showJsonPathQueryDialog = false;
    jsonPathQueryResult: string = '';

    // JSON visualization properties
    showJsonVisualize = false;

    // Search and replace properties
    showSearchReplace = false;
    searchReplaceText = '';

    // Maximize/minimize properties
    isInputMaximized = false;
    isOutputMaximized = false;

    constructor(
        private snackBar: MatSnackBar,
        private jsonService: JsonService,
        private versionHistoryService: VersionHistoryService,
        private dialog: MatDialog,
        private sanitizationService: InputSanitizationService,
        private securityUtils: SecurityUtilsService
    ) {
        // Listen for dark mode changes
        document.body.addEventListener('DOMSubtreeModified', () => {
            this.updateTheme();
        });
    }

    /**
     * Handles input changes from the JsonInputEditorComponent
     * This method is a key part of the data flow between components:
     * 1. JsonInputEditorComponent emits changes via jsonInputChange event
     * 2. This method updates the jsonInput FormControl
     * 3. validateJson() is called to process the input
     * 4. If valid, updateOutput() updates the jsonOutput FormControl
     * 5. Child components react to the changes via their @Input properties
     *
     * @param value The new JSON input value
     */
    onJsonInputChange(value: string): void {
        this.jsonInput.setValue(value);
        this.validateJson();

        // Auto-save version if JSON is valid and not empty
        if (this.isValidJson && value.trim() !== '') {
            this.saveVersion();
        }
    }

    /**
     * Saves the current JSON content as a version
     * @param name Optional name for the version
     */
    saveVersion(name?: string): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            return;
        }

        this.versionHistoryService.addVersion(this.jsonInput.value, name);
    }

    /**
     * Loads JSON content from a saved version
     * @param content The JSON content to load
     */
    loadVersionContent(content: string): void {
        if (!content) {
            return;
        }

        this.jsonInput.setValue(content);

        // Update the input editor
        if (this.jsonInputEditor) {
            this.jsonInputEditor.setValue(content);
        }

        this.validateJson();
        this.updateOutput();
    }

    /**
     * Updates the theme for all components
     */
    updateTheme(): void {
        // Theme updates will be handled by the child components through the isDarkTheme input
    }

    // Listen for keyboard shortcuts
    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        // Only process if Ctrl key is pressed
        if (event.ctrlKey) {
            switch (event.key.toLowerCase()) {
                case 'f':
                    event.preventDefault();
                    this.toggleSearchBar();
                    break;
                case 'b':
                    event.preventDefault();
                    this.beautifyJson();
                    break;
                case 'm':
                    event.preventDefault();
                    this.minifyJson();
                    break;
                case 'l':
                    event.preventDefault();
                    this.lintJson();
                    break;
                case 'c':
                    // Let the browser handle copy if we're in an input field
                    if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                        event.preventDefault();
                        this.copyToClipboard();
                    }
                    break;
                case 's':
                    event.preventDefault();
                    this.downloadJson();
                    break;
                case 'd':
                    event.preventDefault();
                    this.clearEditor();
                    break;
                case 'k':
                    event.preventDefault();
                    this.toggleKeyboardShortcuts();
                    break;
                case '1':
                    event.preventDefault();
                    this.toggleInputMaximize();
                    break;
                case '2':
                    event.preventDefault();
                    this.toggleOutputMaximize();
                    break;
            }
        }
    }

    /**
     * Toggles the search bar visibility
     */
    toggleSearchBar(): void {
        // Determine which view is active or toggle all off if none is specifically active
        if (this.isInputMaximized) {
            // Input editor is maximized
            this.showInputSearchBar = !this.showInputSearchBar;
            // Hide other search bars
            this.showOutputSearchBar = false;
            this.showTreeSearchBar = false;

            if (this.showInputSearchBar) {
                // Focus the input search field after a short delay to allow the UI to update
                setTimeout(() => {
                    const inputSearchField = document.querySelector('.input-search-field input') as HTMLElement;
                    if (inputSearchField) {
                        inputSearchField.focus();
                    }
                }, 100);
            }
        } else if (this.isOutputMaximized || (!this.isInputMaximized && !this.showTreeView)) {
            // Output editor is active
            this.showOutputSearchBar = !this.showOutputSearchBar;
            // Hide other search bars
            this.showInputSearchBar = false;
            this.showTreeSearchBar = false;

            if (this.showOutputSearchBar) {
                // Focus the output search field after a short delay
                setTimeout(() => {
                    const outputSearchField = document.querySelector('.output-search-field input') as HTMLElement;
                    if (outputSearchField) {
                        outputSearchField.focus();
                    }
                }, 100);
            }
        } else if (this.showTreeView) {
            // Tree view is active
            this.showTreeSearchBar = !this.showTreeSearchBar;
            // Hide other search bars
            this.showInputSearchBar = false;
            this.showOutputSearchBar = false;

            if (this.showTreeSearchBar) {
                // Focus the tree search field after a short delay
                setTimeout(() => {
                    const treeSearchField = document.querySelector('.tree-search-field input') as HTMLElement;
                    if (treeSearchField) {
                        treeSearchField.focus();
                    }
                }, 100);
            }
        } else {
            // No specific view is active, toggle all search bars off
            this.showInputSearchBar = false;
            this.showOutputSearchBar = false;
            this.showTreeSearchBar = false;
        }
    }

    toggleKeyboardShortcuts(): void {
        this.showKeyboardShortcuts = !this.showKeyboardShortcuts;
    }

    toggleTheme(): void {
        this.isDarkTheme = !this.isDarkTheme;
        document.body.classList.toggle('dark-theme', this.isDarkTheme);

        // Update themes in child components
        if (this.jsonInputEditor) {
            this.jsonInputEditor.updateEditorTheme();
        }

        if (this.jsonOutputEditor) {
            this.jsonOutputEditor.updateOutputEditorTheme();
        }

        // Store theme preference in localStorage
        localStorage.setItem('jsonBeautyTheme', this.isDarkTheme ? 'dark' : 'light');
    }

    /**
     * Toggles the maximized state of the input section
     */
    toggleInputMaximize(): void {
        this.isInputMaximized = !this.isInputMaximized;

        // If input is being maximized, ensure output is minimized
        if (this.isInputMaximized) {
            this.isOutputMaximized = false;
        }
    }

    /**
     * Toggles the maximized state of the output section
     */
    toggleOutputMaximize(): void {
        this.isOutputMaximized = !this.isOutputMaximized;

        // If output is being maximized, ensure input is minimized
        if (this.isOutputMaximized) {
            this.isInputMaximized = false;
        }
    }

    /**
     * Toggles between text and tree views (legacy method, kept for backward compatibility)
     */
    toggleTreeView(): void {
        // Toggle between text and tree view modes
        this.selectedViewMode = this.selectedViewMode === 'text' ? 'tree' : 'text';
        this.handleViewModeChange(this.selectedViewMode);
    }

    /**
     * Handles changes to the view mode (text, tree, table)
     * @param viewMode The new view mode
     */
    handleViewModeChange(viewMode: 'text' | 'tree' | 'table'): void {
        // If trying to enable tree or table view in YAML mode, switch to JSON mode first
        if ((viewMode === 'tree' || viewMode === 'table') && this.selectedOutputFormat === 'yaml') {
            this.selectedOutputFormat = 'json';
            this.showSuccess('Switched to JSON mode for ' + viewMode + ' view');
        }

        // Update the view mode
        this.selectedViewMode = viewMode;

        // Update showTreeView for backward compatibility
        this.showTreeView = viewMode === 'tree' || viewMode === 'table';

        if ((viewMode === 'tree' || viewMode === 'table') && this.isValidJson) {
            try {
                // Parse the JSON to create the tree data
                this.jsonTreeData = JSON.parse(this.jsonOutput.value || '{}');
            } catch (error) {
                this.showError('Error parsing JSON for ' + viewMode + ' view');
                this.selectedViewMode = 'text';
                this.showTreeView = false;
            }
        } else if (viewMode === 'text') {
            // When switching to text view
            if (this.selectedOutputFormat === 'json') {
                // In JSON mode, ensure the output editor is initialized and updated
                setTimeout(() => {
                    if (this.jsonOutputEditor) {
                        this.jsonOutputEditor.initializeOutputEditor();
                    }
                    // Update the output with the formatted JSON
                    this.updateOutput();
                }, 100);
            } else if (this.selectedOutputFormat === 'yaml') {
                // In YAML mode, update the YAML output
                this.updateYamlOutput();
            }
        }
    }

    ngOnInit(): void {
        // Load theme preference from localStorage
        const savedTheme = localStorage.getItem('jsonBeautyTheme');
        if (savedTheme === 'dark') {
            this.isDarkTheme = true;
            document.body.classList.add('dark-theme');
        }

        // Check for JSON data in URL (for shared links)
        this.loadJsonFromUrl();

        // Set some sample JSON to help users get started if no JSON in URL
        const sampleJson = {
            "name": "JSON Beauty",
            "version": "1.0.0",
            "description": "A powerful JSON formatter and validator",
            "features": [
                "Beautify JSON",
                "Minify JSON",
                "Validate JSON",
                "Lint JSON",
                "Format nested JSON",
                "Syntax highlighting"
            ],
            "isAwesome": true,
            "numberOfUsers": 1000
        };

        this.jsonInput.setValue(JSON.stringify(sampleJson, null, 2));
        // The output will be updated after validation in the validateJson method
    }

    ngAfterViewInit(): void {
        // Initialize the input editor with the initial JSON value
        setTimeout(() => {
            if (this.jsonInputEditor) {
                this.jsonInputEditor.setValue(this.jsonInput.value || '');
            }

            // Validate the initial JSON to update the output
            this.validateJson();
        }, 100);
    }

    // Output editor initialization is now handled by the JsonOutputEditorComponent

    // Theme updates are now handled by the child components through the isDarkTheme input

    validateJson(): void {
        const jsonString = this.jsonInput.value || '';
        const result = this.jsonService.validateJson(jsonString);

        this.isValidJson = result.isValid;
        this.errorMessage = result.errorMessage;

        if (this.isValidJson) {
            // If JSON is valid, update the output and other related data
            this.updateOutput();
        } else {
            // If JSON is invalid, clear the output
            this.jsonOutput.setValue('');
            this.yamlOutput.setValue('');
            this.jsonPaths = [];
            this.jsonTreeData = null;

            // Disable tree view if it's active
            if (this.showTreeView) {
                this.showTreeView = false;
                this.showError('Tree view disabled due to invalid JSON');
            }
        }
    }

    /**
     * Updates the JSON paths list
     */
    updateJsonPaths(): void {
        if (!this.isValidJson) return;

        try {
            this.jsonPaths = this.jsonService.findJsonPaths(this.jsonInput.value || '');
        } catch (e: any) {
            console.error('Error finding JSON paths:', e);
        }
    }

    /**
     * Updates the YAML output
     */
    updateYamlOutput(): void {
        if (!this.isValidJson) return;

        try {
            const result = this.jsonService.jsonToYaml(this.jsonInput.value || '');

            const processResult = (yamlString: string) => {
                this.yamlOutput.setValue(yamlString);
            };

            if (result instanceof Promise) {
                result.then(processResult).catch(error => {
                    console.error('Error converting to YAML:', error);
                });
            } else {
                processResult(result);
            }
        } catch (e: any) {
            console.error('Error converting to YAML:', e);
        }
    }

    /**
     * Toggles the JSON paths display
     */
    toggleJsonPaths(): void {
        this.showJsonPaths = !this.showJsonPaths;
        if (this.showJsonPaths && this.jsonPaths.length === 0) {
            this.updateJsonPaths();
        }
    }

    /**
     * Toggles the output format between JSON and YAML
     */
    toggleOutputFormat(): void {
        if (this.selectedOutputFormat === 'json') {
            // Switching from JSON to YAML
            this.selectedOutputFormat = 'yaml';

            // Update YAML output when switching to YAML mode
            this.updateYamlOutput();

            // Disable tree view when switching to YAML mode
            if (this.showTreeView) {
                this.showTreeView = false;
                this.showSuccess('Tree view disabled in YAML mode');
            }
        } else {
            // Switching from YAML to JSON
            this.selectedOutputFormat = 'json';

            try {
                // Convert YAML back to JSON
                const result = this.jsonService.yamlToJson(this.yamlOutput.value || '');

                const processResult = (jsonString: string) => {
                    // Update the input editor with the converted JSON
                    if (this.jsonInputEditor) {
                        this.jsonInputEditor.setValue(jsonString);
                    }
                    this.jsonInput.setValue(jsonString);

                    // Validate the JSON
                    this.validateJson();
                };

                if (result instanceof Promise) {
                    result.then(processResult).catch(error => {
                        this.showError(`Error converting YAML to JSON: ${error instanceof Error ? error.message : String(error)}`);
                    });
                } else {
                    processResult(result);
                }

                // Initialize the output editor if switching to JSON mode
                setTimeout(() => {
                    if (this.jsonOutputEditor) {
                        this.jsonOutputEditor.initializeOutputEditor();
                    }
                    // Update JSON output
                    this.updateOutput();
                }, 100);
            } catch (error) {
                this.showError(`Error converting YAML to JSON: ${error instanceof Error ? error.message : String(error)}`);
                // Stay in YAML mode if conversion fails
                this.selectedOutputFormat = 'yaml';
            }
        }
    }

    beautifyJson(): void {
        try {
            const beautified = this.jsonService.beautifyJson(this.jsonInput.value || '{}');

            // Update the input editor
            if (this.jsonInputEditor) {
                this.jsonInputEditor.setValue(beautified);
            }

            this.jsonInput.setValue(beautified);
            this.jsonOutput.setValue(beautified);

            // After beautification, validate the JSON
            this.validateJson();

            // If the JSON is now valid, update other related data
            if (this.isValidJson) {
                this.updateJsonPaths();
                this.updateYamlOutput();

                // Update tree view if active
                if (this.showTreeView) {
                    try {
                        this.jsonTreeData = JSON.parse(beautified);
                        // Reset expanded nodes when JSON changes
                        this.expandedNodes.clear();
                    } catch (error) {
                        this.jsonTreeData = null;
                    }
                }
            }

            this.showSuccess('JSON beautified successfully');
        } catch (e: any) {
            this.showError('Error beautifying JSON: ' + e.message);
        }
    }

    minifyJson(): void {
        try {
            const minified = this.jsonService.minifyJson(this.jsonInput.value || '{}');
            this.jsonOutput.setValue(minified);

            // After minification, validate the JSON
            this.validateJson();

            // If the JSON is now valid, update other related data
            if (this.isValidJson) {
                this.updateJsonPaths();
                this.updateYamlOutput();

                // Update tree view if active
                if (this.showTreeView) {
                    try {
                        this.jsonTreeData = JSON.parse(minified);
                        // Reset expanded nodes when JSON changes
                        this.expandedNodes.clear();
                    } catch (error) {
                        this.jsonTreeData = null;
                    }
                }
            }

            this.showSuccess('JSON minified successfully');
        } catch (e: any) {
            this.showError('Error minifying JSON: ' + e.message);
        }
    }

    lintJson(): void {
        try {
            const linted = this.jsonService.lintJson(this.jsonInput.value || '{}');

            // Update the input editor
            if (this.jsonInputEditor) {
                this.jsonInputEditor.setValue(linted);
            }

            this.jsonInput.setValue(linted);
            this.jsonOutput.setValue(linted);

            // After linting, validate the JSON
            this.validateJson();

            // If the JSON is now valid, update other related data
            if (this.isValidJson) {
                this.updateJsonPaths();
                this.updateYamlOutput();

                // Update tree view if active
                if (this.showTreeView) {
                    try {
                        this.jsonTreeData = JSON.parse(linted);
                        // Reset expanded nodes when JSON changes
                        this.expandedNodes.clear();
                    } catch (error) {
                        this.jsonTreeData = null;
                    }
                }
            }

            this.showSuccess('JSON linted successfully');
        } catch (e: any) {
            this.showError('Error linting JSON: ' + e.message);
        }
    }

    sortObjectKeys(obj: any): any {
        // If not an object or is null, return as is
        if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
            return obj;
        }

        // Create a new object with sorted keys
        const sortedObj: any = {};
        Object.keys(obj).sort().forEach(key => {
            sortedObj[key] = this.sortObjectKeys(obj[key]);
        });

        return sortedObj;
    }

    /**
     * Updates the output based on the current input JSON
     * This method is central to the data flow from input to output:
     * 1. Called after validateJson() confirms the JSON is valid
     * 2. Beautifies the JSON and updates the jsonOutput FormControl
     * 3. Updates the tree view data if tree view is active
     * 4. Updates JSON paths and YAML output
     * 5. Child components (JsonOutputEditorComponent, JsonPathsComponent)
     *    react to these changes via their @Input properties
     */
    updateOutput(): void {
        if (this.isValidJson) {
            const jsonString = this.jsonInput.value || '';
            try {
                // Beautify the JSON before setting it to the output
                const beautifiedJson = this.jsonService.beautifyJson(jsonString);
                this.jsonOutput.setValue(beautifiedJson);

                // Update tree view data if tree view is active
                if (this.showTreeView) {
                    try {
                        this.jsonTreeData = JSON.parse(jsonString);
                        // Reset expanded nodes when JSON changes
                        this.expandedNodes.clear();
                    } catch (error) {
                        this.jsonTreeData = null;
                        // Disable tree view if parsing fails
                        this.showTreeView = false;
                        this.showError('Tree view disabled due to JSON parsing error');
                    }
                }

                this.updateJsonPaths();
                this.updateYamlOutput();
            } catch (error) {
                console.error('Error beautifying JSON:', error);
                // Fallback to unformatted JSON if beautification fails
                this.jsonOutput.setValue(jsonString);
            }
        } else {
            this.jsonOutput.setValue('');
            this.yamlOutput.setValue('');
            this.jsonPaths = [];
            this.jsonTreeData = null;
        }
    }

    /**
     * Downloads the output in the selected format
     */
    downloadOutput(): void {
        if (this.selectedOutputFormat === 'json') {
            this.downloadJson();
        } else {
            this.downloadYaml();
        }
    }

    /**
     * Downloads the JSON output as a text file
     */
    downloadText(): void {
        if (!this.jsonOutput.value) {
            this.showError('Nothing to download');
            return;
        }

        const blob = new Blob([this.jsonOutput.value], {type: 'text/plain'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'json-data.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.showSuccess('Text file downloaded successfully');
    }

    /**
     * Downloads the YAML output
     */
    downloadYaml(): void {
        if (!this.yamlOutput.value) {
            this.showError('Nothing to download');
            return;
        }

        const blob = new Blob([this.yamlOutput.value], {type: 'application/yaml'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted-yaml.yaml';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.showSuccess('YAML downloaded successfully');
    }

    /**
     * Converts JSON to CSV and downloads it
     */
    convertToCsv(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to convert to CSV');
            return;
        }

        try {
            // Convert JSON to CSV
            const result = this.jsonService.jsonToCsv(this.jsonInput.value);

            const processResult = (csvString: string) => {
                if (!csvString) {
                    this.showError('Could not convert JSON to CSV. The JSON structure may not be suitable for CSV conversion.');
                    return;
                }

                // Download the CSV
                const blob = new Blob([csvString], {type: 'text/csv'});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'json-data.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess('JSON converted to CSV and downloaded successfully');
            };

            if (result instanceof Promise) {
                result.then(processResult).catch(error => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.showError(`Error converting JSON to CSV: ${errorMessage}`);
                });
            } else {
                processResult(result);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error converting JSON to CSV: ${errorMessage}`);
        }
    }

    /**
     * Converts JSON to XML and downloads it
     */
    convertToXml(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to convert to XML');
            return;
        }

        try {
            // Convert JSON to XML
            const result = this.jsonService.jsonToXml(this.jsonInput.value);

            const processResult = (xmlString: string) => {
                if (!xmlString) {
                    this.showError('Could not convert JSON to XML. The JSON structure may not be suitable for XML conversion.');
                    return;
                }

                // Download the XML
                const blob = new Blob([xmlString], {type: 'application/xml'});
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'json-data.xml';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                this.showSuccess('JSON converted to XML and downloaded successfully');
            };

            if (result instanceof Promise) {
                result.then(processResult).catch(error => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.showError(`Error converting JSON to XML: ${errorMessage}`);
                });
            } else {
                processResult(result);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error converting JSON to XML: ${errorMessage}`);
        }
    }

    copyToClipboard(): void {
        const textToCopy = this.selectedOutputFormat === 'json'
            ? this.jsonOutput.value
            : this.yamlOutput.value;

        if (!textToCopy) {
            this.showError('Nothing to copy');
            return;
        }

        navigator.clipboard.writeText(textToCopy)
            .then(() => this.showSuccess(`${this.selectedOutputFormat.toUpperCase()} copied to clipboard`))
            .catch(err => this.showError('Failed to copy: ' + err));
    }

    downloadJson(): void {
        if (!this.jsonOutput.value) {
            this.showError('Nothing to download');
            return;
        }

        const blob = new Blob([this.jsonOutput.value], {type: 'application/json'});
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted-json.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        this.showSuccess('JSON downloaded successfully');
    }

    clearEditor(): void {
        // Clear the input editor
        if (this.jsonInputEditor) {
            this.jsonInputEditor.clearEditor();
        }

        this.jsonInput.setValue('');
        this.jsonOutput.setValue('');
        this.isValidJson = false;
        this.errorMessage = 'JSON is empty';
        this.schemaValidationResult = null;

        // Clear other data
        this.yamlOutput.setValue('');
        this.jsonPaths = [];
        this.jsonTreeData = null;
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
            this.showError(`Invalid file: Only JSON files up to 5MB are allowed`);
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
                if (this.jsonInputEditor) {
                    this.jsonInputEditor.setValue(sanitizedContent);
                }

                this.jsonInput.setValue(sanitizedContent);
                this.validateJson();
                this.updateOutput();

                // Sanitize file name before displaying in UI
                const sanitizedFileName = this.sanitizationService.sanitizeString(file.name);
                this.showSuccess(`File "${sanitizedFileName}" imported successfully`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                // Sanitize error message before displaying
                const sanitizedError = this.sanitizationService.sanitizeString(errorMessage);
                this.showError(`Error importing file: ${sanitizedError}`);
            }

            // Reset the file input so the same file can be selected again
            event.target.value = '';
        };
        
        reader.onerror = () => {
            this.showError('Error reading file');
            event.target.value = '';
        };

        reader.readAsText(file);
    }

    /**
     * Searches in the JSON tree view
     * @param searchText The text to search for in the tree
     */
    searchInTree(searchText: string): void {
        if (!searchText || !this.jsonTreeData) {
            this.clearTreeSearch();
            return;
        }

        // Implement tree search logic here
        // This is a simple implementation that highlights nodes containing the search text
        try {
            // Convert tree to string for searching
            const jsonString = JSON.stringify(this.jsonTreeData);

            if (jsonString.toLowerCase().includes(searchText.toLowerCase())) {
                this.treeSearchHighlighted = true;
                this.showSuccess(`Found matches for "${searchText}" in the tree view`);
            } else {
                this.treeSearchHighlighted = false;
                this.showError(`No matches found for "${searchText}" in the tree view`);
            }
        } catch (e) {
            this.showError(`Error searching in tree: ${e instanceof Error ? e.message : String(e)}`);
        }
    }

    // Search functionality is now handled by the child components

    /**
     * Clears the tree search highlighting
     */
    clearTreeSearch(): void {
        this.treeSearchHighlighted = false;
    }

    /**
     * Toggles the schema editor visibility
     */
    toggleSchemaEditor(): void {
        this.showSchemaEditor = !this.showSchemaEditor;

        // If showing the schema editor and it's empty, add a sample schema
        if (this.showSchemaEditor && !this.schemaInput.value) {
            const sampleSchema = {
                "$schema": "http://json-schema.org/draft-07/schema#",
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "version": {"type": "string"},
                    "description": {"type": "string"},
                    "features": {
                        "type": "array",
                        "items": {"type": "string"}
                    },
                    "isAwesome": {"type": "boolean"},
                    "numberOfUsers": {"type": "number"}
                },
                "required": ["name", "version"]
            };
            this.schemaInput.setValue(JSON.stringify(sampleSchema, null, 2));
        }
    }

    /**
     * Validates JSON against the provided schema
     */
    validateJsonSchema(): void {
        if (!this.isValidJson) {
            this.showError('Cannot validate invalid JSON');
            return;
        }

        if (!this.schemaInput.value) {
            this.showError('Schema is empty');
            return;
        }

        try {
            // Get the validation result from the service
            const validationResult = this.jsonService.validateJsonSchema(
                this.jsonInput.value || '{}',
                this.schemaInput.value
            );

            // Ensure errors is always defined to match our expected type
            this.schemaValidationResult = {
                isValid: validationResult.isValid,
                errors: validationResult.errors || [] // Provide empty array if errors is undefined
            };

            // Check if validation was successful
            if (this.schemaValidationResult && this.schemaValidationResult.isValid) {
                this.showSuccess('JSON is valid against the schema');
            } else {
                this.showError('JSON does not match the schema');
            }
        } catch (e: any) {
            this.showError('Error validating against schema: ' + e.message);
            this.schemaValidationResult = {
                isValid: false,
                errors: [{message: e.message}]
            };
        }
    }

    /**
     * Generates a JSON schema from the current JSON data
     */
    generateJsonSchema(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to generate a schema');
            return;
        }

        try {
            // Generate the schema
            const schema = this.jsonService.generateJsonSchema(this.jsonInput.value);

            // Set the schema to the schema input
            this.schemaInput.setValue(schema);

            // Show the schema editor
            this.showSchemaEditor = true;

            this.showSuccess('JSON schema generated successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error generating JSON schema: ${errorMessage}`);
        }
    }

    /**
     * Toggles the JSON path query dialog
     */
    toggleJsonPathQuery(): void {
        this.showJsonPathQueryDialog = !this.showJsonPathQueryDialog;

        if (this.showJsonPathQueryDialog && !this.jsonPathQuery.value) {
            // Set a default query example
            this.jsonPathQuery.setValue('$');
        }

        if (this.showJsonPathQueryDialog && this.jsonPathQuery.value) {
            // Execute the query if there's already a value
            this.executeJsonPathQuery();
        }
    }

    /**
     * Executes a JSONPath query on the current JSON data
     */
    executeJsonPathQuery(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to query');
            return;
        }

        if (!this.jsonPathQuery.value) {
            this.showError('Please enter a JSONPath query');
            return;
        }

        try {
            // Execute the query
            this.jsonPathQueryResult = this.jsonService.queryJsonPath(
                this.jsonInput.value,
                this.jsonPathQuery.value
            );

            this.showSuccess('JSONPath query executed successfully');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error executing JSONPath query: ${errorMessage}`);
            this.jsonPathQueryResult = '';
        }
    }

    /**
     * Toggles the JSON comparison dialog
     */
    toggleJsonCompare(): void {
        this.showJsonCompare = !this.showJsonCompare;

        if (this.showJsonCompare && !this.compareJsonInput.value) {
            // Set a default value for comparison
            this.compareJsonInput.setValue('{}');
        }
    }

    /**
     * Compares the current JSON with another JSON document
     */
    compareJson(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to compare');
            return;
        }

        if (!this.compareJsonInput.value) {
            this.showError('Please enter JSON to compare against');
            return;
        }

        try {
            // Compare the JSON documents
            this.jsonDiffResult = this.jsonService.compareJson(
                this.jsonInput.value,
                this.compareJsonInput.value
            );

            if (this.jsonDiffResult.hasChanges) {
                this.showSuccess('JSON comparison completed. Differences found.');
            } else {
                this.showSuccess('JSON comparison completed. No differences found.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error comparing JSON: ${errorMessage}`);
            this.jsonDiffResult = null;
        }
    }

    /**
     * Toggles the JSON visualization dialog
     */
    toggleJsonVisualize(): void {
        this.showJsonVisualize = !this.showJsonVisualize;

        if (this.showJsonVisualize) {
            // Initialize visualization if needed
            this.initializeVisualization();
        }
    }

    /**
     * Toggles the search and replace panel
     */
    toggleSearchReplace(): void {
        this.showSearchReplace = !this.showSearchReplace;

        if (this.showSearchReplace) {
            // Set the current text for search and replace
            this.searchReplaceText = this.jsonInput.value || '';
        }
    }

    /**
     * Handles text changes from the search and replace component
     * @param newText The updated text
     */
    onSearchReplaceTextChanged(newText: string): void {
        this.searchReplaceText = newText;
        this.jsonInput.setValue(newText);
        this.validateJson();
    }

    getJsonSize(): string {
        const jsonValue = this.jsonInput.value || '';
        const charCount = jsonValue.length;

        if (charCount < 1000) {
            return charCount.toString();
        } else if (charCount < 1000000) {
            return (charCount / 1000).toFixed(1) + 'K';
        } else {
            return (charCount / 1000000).toFixed(1) + 'M';
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
     * Toggles a node's expanded state
     * @param nodeId The ID of the node to toggle
     */
    toggleNode(nodeId: string): void {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
        } else {
            this.expandedNodes.add(nodeId);
        }
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
     * Tree View Helper Methods
     */

    /**
     * Checks if a value is a string
     * @param value The value to check
     * @returns True if the value is a string
     */
    isString(value: any): boolean {
        return typeof value === 'string';
    }

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
     * Generates a shareable URL with the current JSON data and opens a dialog
     * with options to copy, share, and view the shared content
     */
    shareJson(): void {
        if (!this.isValidJson) {
            this.showError('Cannot share invalid JSON');
            return;
        }

        try {
            // Sanitize the JSON input before minifying
            const sanitizedInput = this.sanitizationService.sanitizeJsonInput(this.jsonInput.value || '{}');
            
            // Compress the JSON to make the URL shorter
            const jsonString = this.jsonService.minifyJson(sanitizedInput);

            // Encode the JSON for the URL
            const encodedJson = encodeURIComponent(jsonString);

            // Create the URL with the JSON data as a query parameter
            const baseUrl = window.location.href.split('?')[0];
            const shareableUrl = `${baseUrl}?json=${encodedJson}`;
            
            // Sanitize the URL
            const sanitizedUrl = this.sanitizationService.sanitizeUrl(shareableUrl);

            // Open the share dialog
            this.dialog.open(ShareDialogComponent, {
                width: '550px',
                data: {
                    shareableUrl: sanitizedUrl,
                    jsonContent: sanitizedInput
                }
            });

            // Save this version to history
            this.saveVersion('Shared version');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Sanitize error message before displaying
            const sanitizedError = this.sanitizationService.sanitizeString(errorMessage);
            this.showError(`Error generating shareable URL: ${sanitizedError}`);
        }
    }

    /**
     * Loads JSON data from the URL query parameter
     */
    loadJsonFromUrl(): void {
        try {
            // Get the URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const jsonParam = urlParams.get('json');

            if (jsonParam) {
                // Decode the JSON data
                const decodedJson = decodeURIComponent(jsonParam);
                
                // Sanitize the decoded JSON before processing
                const sanitizedJson = this.sanitizationService.sanitizeJsonInput(decodedJson);

                // Try to parse the JSON to validate it
                JSON.parse(sanitizedJson);

                // Set the input value
                this.jsonInput.setValue(sanitizedJson);

                // Set the input editor value after it's initialized
                setTimeout(() => {
                    if (this.jsonInputEditor) {
                        this.jsonInputEditor.setValue(sanitizedJson);
                    }

                    // Beautify the JSON for better readability
                    this.beautifyJson();

                    this.showSuccess('JSON loaded from shared URL');
                }, 100);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Sanitize error message before displaying
            const sanitizedError = this.sanitizationService.sanitizeString(errorMessage);
            this.showError(`Error loading JSON from URL: ${sanitizedError}`);
        }
    }

    /**
     * Applies the current formatting options to the JSON
     */
    applyFormatting(): void {
        if (!this.isValidJson) {
            return;
        }

        try {
            // Update the JSON service with the new indentation settings
            this.jsonService.setIndentation(this.indentSize, this.indentChar as ' ' | '\t');

            // Re-beautify the JSON with the new settings
            const formatted = this.jsonService.beautifyJson(this.jsonInput.value || '{}');

            // Update the output
            this.jsonOutput.setValue(formatted);

            // The output editor will be updated through data binding in the child component

            this.showSuccess('Formatting options applied');
        } catch (error) {
            this.showError(`Error applying formatting: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get the context around the error position to help identify the issue
     */
    private getErrorContext(jsonString: string, position: number): string {
        const start = Math.max(0, position - 10);
        const end = Math.min(jsonString.length, position + 10);
        let context = jsonString.substring(start, end);

        // Highlight the error position with a marker
        if (position >= start && position < end) {
            const relativePos = position - start;
            context = context.substring(0, relativePos) + '👉' + context.substring(relativePos);
        }

        return context;
    }

    /**
     * Initializes the JSON visualization
     */
    private initializeVisualization(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to visualize');
            return;
        }

        try {
            // For now, just show a message that visualization is not fully implemented
            this.showSuccess('JSON visualization feature is coming soon!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error initializing visualization: ${errorMessage}`);
        }
    }

    private showSuccess(message: string): void {
        // Sanitize message before displaying
        const sanitizedMessage = this.sanitizationService.sanitizeString(message);
        this.snackBar.open(sanitizedMessage, 'Close', {
            duration: 3000,
            panelClass: 'success-snackbar'
        });
    }

    private showError(message: string): void {
        // Sanitize message before displaying
        const sanitizedMessage = this.sanitizationService.sanitizeString(message);
        this.snackBar.open(sanitizedMessage, 'Close', {
            duration: 5000,
            panelClass: 'error-snackbar'
        });
    }
}
