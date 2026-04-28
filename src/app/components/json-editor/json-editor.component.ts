import {AfterViewInit, Component, DestroyRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {JsonService} from '../../services/json.service';
import {VersionHistoryService} from '../../services/history/version-history.service';
import {InputSanitizationService} from '../../services/security/input-sanitization.service';
import {SecurityUtilsService} from '../../services/security/security-utils.service';
import {ShareDialogComponent} from '../share-dialog/share-dialog.component';
import {JsonInputEditorComponent} from '../json-input-editor/json-input-editor.component';
import {JsonOutputEditorComponent} from '../json-output-editor/json-output-editor.component';
import {SettingsService} from '../../services/settings/settings.service';
import {ThemeService} from '../../services/theme/theme.service';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

/**
 * Coordinates JSON input/output editors, dialogs, and panels.
 * Persistence and algorithms live in services; this class wires UI state and user actions.
 */
@Component({
    selector: 'app-json-editor',
    templateUrl: './json-editor.component.html',
    styleUrls: ['./json-editor.component.scss']
})
export class JsonEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    private static readonly DEFAULT_SAMPLE_OBJECT = {
        name: 'JSON Beauty',
        version: '1.0.0',
        description: 'A powerful JSON formatter and validator',
        features: [
            'Beautify JSON',
            'Minify JSON',
            'Validate JSON',
            'Lint JSON',
            'Format nested JSON',
            'Syntax highlighting'
        ],
        isAwesome: true,
        numberOfUsers: 1000
    };

    private isResizingPanels = false;
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
        {key: 'Ctrl / Cmd + F', action: 'Show/Hide floating find bar'},
        {key: 'Ctrl / Cmd + Shift + F', action: 'Show/Hide Search & Replace panel'},
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

    /** Floating find (Ctrl+F): targets input Ace, output Ace, or tree filter. */
    floatingSearchOpen = false;
    floatingSearchTarget: 'input' | 'output' | 'tree' = 'input';
    floatingSearchQuery = '';
    floatingSearchMatchCount = 0;

    /** When true, vertical scroll position is mirrored between input and JSON output editors. */
    syncScrollEnabled = false;
    private suppressScrollSync = false;
    private scrollSyncCleanups: Array<() => void> = [];

    /** Input editor cursor for the status bar (1-based). */
    inputCursorLine = 1;
    inputCursorColumn = 1;

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

    // Maximize/minimize properties
    isInputMaximized = false;
    isOutputMaximized = false;
    inputPanelWidth = 50;
    private hasLoadedSharedJson = false;

    constructor(
        private snackBar: MatSnackBar,
        private jsonService: JsonService,
        private versionHistoryService: VersionHistoryService,
        private dialog: MatDialog,
        private sanitizationService: InputSanitizationService,
        private securityUtils: SecurityUtilsService,
        private settingsService: SettingsService,
        private themeService: ThemeService,
        private destroyRef: DestroyRef
    ) {}

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
     * Compares the current JSON against a selected history version.
     * @param versionContent JSON content from version history
     */
    compareWithVersionContent(versionContent: string): void {
        if (!versionContent || !this.isValidJson || !this.jsonInput.value) {
            this.showError('Please ensure current JSON and selected version are valid');
            return;
        }

        this.compareJsonInput.setValue(versionContent);

        if (!this.showJsonCompare) {
            this.toggleJsonCompare();
        }

        this.compareJson();
    }

    /**
     * Prefills compare input with the latest saved version that differs from current JSON.
     */
    useLatestVersionForCompare(options: { silent?: boolean } = {}): boolean {
        const current = this.jsonInput.value;
        if (!current) {
            if (!options.silent) {
                this.showError('Please enter JSON before opening compare');
            }
            return false;
        }

        const latestDifferentVersion = this.versionHistoryService
            .getVersions()
            .find(version => version.content !== current);

        if (!latestDifferentVersion) {
            if (!options.silent) {
                this.showError('No different saved version found to compare');
            }
            return false;
        }

        this.compareJsonInput.setValue(latestDifferentVersion.content);
        if (!options.silent) {
            this.showSuccess('Loaded latest saved version for comparison');
        }
        return true;
    }

    /**
     * Opens compare dialog and runs comparison with latest different saved version.
     */
    quickDiffWithLatestVersion(): void {
        if (!this.isValidJson || !this.jsonInput.value) {
            this.showError('Please enter valid JSON to compare');
            return;
        }

        const hasVersionToCompare = this.useLatestVersionForCompare();
        if (!hasVersionToCompare) {
            return;
        }

        if (!this.showJsonCompare) {
            this.showJsonCompare = true;
        }

        this.compareJson();
    }

    @HostListener('document:keydown', ['$event'])
    onDocumentEscape(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.floatingSearchOpen) {
            this.floatingSearchOpen = false;
        }
    }

    // Listen for keyboard shortcuts
    @HostListener('window:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent): void {
        const mod = event.ctrlKey || event.metaKey;
        if (!mod) {
            return;
        }

        switch (event.key.toLowerCase()) {
            case 'f':
                event.preventDefault();
                if (event.shiftKey) {
                    this.settingsService.toggleSearchReplace();
                } else {
                    this.toggleSearchBar();
                }
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

    @HostListener('window:mousemove', ['$event'])
    onPanelResize(event: MouseEvent): void {
        if (!this.isResizingPanels || window.innerWidth <= 991) {
            return;
        }

        const viewportWidth = window.innerWidth;
        const nextWidth = (event.clientX / viewportWidth) * 100;
        this.inputPanelWidth = Math.min(75, Math.max(25, nextWidth));
    }

    @HostListener('window:mouseup')
    stopPanelResize(): void {
        if (!this.isResizingPanels) {
            return;
        }

        this.isResizingPanels = false;
        document.body.classList.remove('resizing-panels');
    }

    /**
     * Toggles the floating find bar (Ctrl+F).
     */
    toggleSearchBar(): void {
        this.floatingSearchOpen = !this.floatingSearchOpen;
        if (this.floatingSearchOpen) {
            if (this.selectedViewMode === 'tree') {
                this.floatingSearchTarget = 'tree';
            } else if (this.isOutputMaximized && this.canSearchOutputAce()) {
                this.floatingSearchTarget = 'output';
            } else {
                this.floatingSearchTarget = 'input';
            }
            this.updateFloatingSearchMatchCount();
            setTimeout(() => this.focusQuerySelector('.floating-search-query', 0), 80);
        }
    }

    closeFloatingSearch(): void {
        this.floatingSearchOpen = false;
    }

    onFloatingSearchTargetChange(event: MatButtonToggleChange): void {
        const v = event.value as 'input' | 'output' | 'tree' | undefined;
        if (v) {
            this.floatingSearchTarget = v;
            this.updateFloatingSearchMatchCount();
        }
    }

    onFloatingSearchQueryChange(_value: string): void {
        this.updateFloatingSearchMatchCount();
    }

    runFloatingSearch(): void {
        const q = this.floatingSearchQuery.trim();
        if (!q) {
            this.jsonInputEditor?.clearSearch();
            this.jsonOutputEditor?.clearSearch();
            this.jsonOutputEditor?.clearTreeSearch();
            this.floatingSearchMatchCount = 0;
            return;
        }
        if (this.floatingSearchTarget === 'input') {
            this.jsonInputEditor?.searchInJson(q);
        } else if (this.floatingSearchTarget === 'output') {
            this.jsonOutputEditor?.searchInJson(q);
        } else {
            this.jsonOutputEditor?.searchInTree(q);
        }
        this.updateFloatingSearchMatchCount();
    }

    floatingSearchPrevious(): void {
        if (this.floatingSearchTarget === 'tree') {
            return;
        }
        if (this.floatingSearchTarget === 'input') {
            this.jsonInputEditor?.findPrevious();
        } else {
            this.jsonOutputEditor?.findPrevious();
        }
    }

    floatingSearchNext(): void {
        if (this.floatingSearchTarget === 'tree') {
            return;
        }
        if (this.floatingSearchTarget === 'input') {
            this.jsonInputEditor?.findNext();
        } else {
            this.jsonOutputEditor?.findNext();
        }
    }

    canSearchOutputAce(): boolean {
        return this.isValidJson && this.selectedOutputFormat === 'json' && this.selectedViewMode === 'text';
    }

    openImportPicker(): void {
        this.jsonInputEditor?.openFilePicker();
    }

    loadSampleJson(): void {
        const str = JSON.stringify(JsonEditorComponent.DEFAULT_SAMPLE_OBJECT, null, 2);
        this.jsonInputEditor?.setValue(str);
        this.jsonInput.setValue(str);
        this.validateJson();
        this.updateOutput();
        this.showSuccess('Sample JSON loaded');
    }

    sortKeysJson(): void {
        if (!this.isValidJson) {
            this.showError('Enter valid JSON before sorting keys');
            return;
        }
        try {
            const parsed = JSON.parse(this.jsonInput.value || '{}');
            const sorted = this.sortObjectKeys(parsed);
            const str = JSON.stringify(sorted, null, 2);
            this.applyTransformedJson(str);
            this.showSuccess('Object keys sorted');
        } catch {
            this.showError('Could not sort keys');
        }
    }

    openToolYaml(): void {
        if (!this.isValidJson) {
            this.showError('Enter valid JSON first');
            return;
        }
        if (this.selectedOutputFormat === 'json') {
            this.toggleOutputFormat();
        }
    }

    onInputCursorPosition(pos: { line: number; column: number }): void {
        this.inputCursorLine = pos.line;
        this.inputCursorColumn = pos.column;
    }

    onSyncScrollChange(enabled: boolean): void {
        this.syncScrollEnabled = enabled;
        this.teardownScrollSync();
        if (enabled) {
            this.scheduleScrollSyncBind();
        }
    }

    getDisplaySize(): string {
        const raw = this.jsonInput.value || '';
        const bytes = new Blob([raw]).size;
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    ngOnDestroy(): void {
        this.teardownScrollSync();
    }

    toggleKeyboardShortcuts(): void {
        // Delegate to the settings service
        this.settingsService.toggleKeyboardShortcuts();
    }

    startPanelResize(event: MouseEvent): void {
        if (window.innerWidth <= 991) {
            return;
        }

        event.preventDefault();
        this.isResizingPanels = true;
        document.body.classList.add('resizing-panels');
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
     * Toggles tree view vs text view (from features menu). From table view, switches to tree.
     */
    toggleTreeView(): void {
        const next: 'text' | 'tree' = this.selectedViewMode === 'tree' ? 'text' : 'tree';
        this.handleViewModeChange(next);
    }

    /**
     * Handles changes to the view mode (text, tree, table)
     * @param viewMode The new view mode
     */
    handleViewModeChange(viewMode: 'text' | 'tree' | 'table'): void {
        if ((viewMode === 'tree' || viewMode === 'table') && !this.isValidJson) {
            this.showError('Please enter valid JSON to use tree or table view');
            return;
        }

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
                // Keep the root open so users immediately see content.
                this.expandedNodes.clear();
                this.expandedNodes.add('$');
            } catch (error) {
                this.showError('Error parsing JSON for ' + viewMode + ' view');
                this.selectedViewMode = 'text';
                this.showTreeView = false;
            }
        } else if (viewMode === 'text') {
            // When switching to text view
            if (this.selectedOutputFormat === 'json') {
                setTimeout(() => {
                    if (this.jsonOutputEditor) {
                        this.jsonOutputEditor.initializeOutputEditor();
                    }
                    this.updateOutput();
                }, 100);
            } else if (this.selectedOutputFormat === 'yaml') {
                this.updateYamlOutput();
            }
        }

        setTimeout(() => {
            this.teardownScrollSync();
            if (this.syncScrollEnabled) {
                this.setupScrollSync();
            }
        }, 280);
    }

    ngOnInit(): void {
        this.isDarkTheme = this.themeService.isDarkTheme();
        this.themeService.currentTheme$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.isDarkTheme = this.themeService.isDarkTheme();
            });

        this.settingsService.showFormattingOptions$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(show => (this.showFormattingOptions = show));

        this.settingsService.showKeyboardShortcuts$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(show => (this.showKeyboardShortcuts = show));

        this.settingsService.showSearchReplace$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(show => {
                this.showSearchReplace = show;
            });

        // Check for JSON data in URL (for shared links)
        this.loadJsonFromUrl();

        if (!this.hasLoadedSharedJson) {
            this.jsonInput.setValue(JSON.stringify(JsonEditorComponent.DEFAULT_SAMPLE_OBJECT, null, 2));
            // The output will be updated after validation in the validateJson method
        }
    }

    ngAfterViewInit(): void {
        // Initialize the input editor with the initial JSON value
        setTimeout(() => {
            if (this.jsonInputEditor) {
                this.jsonInputEditor.setValue(this.jsonInput.value || '');
            }

            // Validate the initial JSON to update the output
            this.validateJson();
            this.scheduleScrollSyncBind();
        }, 100);
    }

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
                this.selectedViewMode = 'text';
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
            this.resolveMaybeAsync(
                this.jsonService.jsonToYaml(this.jsonInput.value || ''),
                yamlString => this.yamlOutput.setValue(yamlString),
                error => console.error('Error converting to YAML:', error)
            );
        } catch (e: unknown) {
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
                this.selectedViewMode = 'text';
                this.showSuccess('Tree view disabled in YAML mode');
            }
        } else {
            // Switching from YAML to JSON
            this.selectedOutputFormat = 'json';
            this.selectedViewMode = 'text';
            this.showTreeView = false;

            try {
                // Convert YAML back to JSON
                this.resolveMaybeAsync(
                    this.jsonService.yamlToJson(this.yamlOutput.value || ''),
                    jsonString => {
                        this.jsonInputEditor?.setValue(jsonString);
                        this.jsonInput.setValue(jsonString);
                        this.validateJson();
                    },
                    error =>
                        this.showError(
                            `Error converting YAML to JSON: ${error instanceof Error ? error.message : String(error)}`
                        )
                );

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
        this.runJsonTransform(
            () => this.jsonService.beautifyJson(this.jsonInput.value || '{}'),
            'JSON beautified successfully',
            'Error beautifying JSON'
        );
    }

    minifyJson(): void {
        this.runJsonTransform(
            () => this.jsonService.minifyJson(this.jsonInput.value || '{}'),
            'JSON minified successfully',
            'Error minifying JSON'
        );
    }

    lintJson(): void {
        this.runJsonTransform(
            () => this.jsonService.lintJson(this.jsonInput.value || '{}'),
            'JSON linted successfully',
            'Error linting JSON'
        );
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
                        this.expandedNodes.add('$');
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

        this.triggerBlobDownload(this.jsonOutput.value, 'text/plain', 'json-data.txt');
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

        this.triggerBlobDownload(this.yamlOutput.value, 'application/yaml', 'formatted-yaml.yaml');
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
            this.resolveMaybeAsync(
                this.jsonService.jsonToCsv(this.jsonInput.value),
                csvString => {
                    if (!csvString) {
                        this.showError(
                            'Could not convert JSON to CSV. The JSON structure may not be suitable for CSV conversion.'
                        );
                        return;
                    }
                    this.triggerBlobDownload(csvString, 'text/csv', 'json-data.csv');
                    this.showSuccess('JSON converted to CSV and downloaded successfully');
                },
                error => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.showError(`Error converting JSON to CSV: ${errorMessage}`);
                }
            );
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
            this.resolveMaybeAsync(
                this.jsonService.jsonToXml(this.jsonInput.value),
                xmlString => {
                    if (!xmlString) {
                        this.showError(
                            'Could not convert JSON to XML. The JSON structure may not be suitable for XML conversion.'
                        );
                        return;
                    }
                    this.triggerBlobDownload(xmlString, 'application/xml', 'json-data.xml');
                    this.showSuccess('JSON converted to XML and downloaded successfully');
                },
                error => {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    this.showError(`Error converting JSON to XML: ${errorMessage}`);
                }
            );
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
            .then(() => this.showSuccess('Copied!'))
            .catch(err => this.showError('Failed to copy: ' + err));
    }

    downloadJson(): void {
        if (!this.jsonOutput.value) {
            this.showError('Nothing to download');
            return;
        }

        this.triggerBlobDownload(this.jsonOutput.value, 'application/json', 'formatted-json.json');
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
            this.useLatestVersionForCompare({silent: true});
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
     * Toggles the search and replace panel (single source of truth: SettingsService).
     */
    toggleSearchReplace(): void {
        this.settingsService.toggleSearchReplace();
    }

    /**
     * Handles text changes from the search and replace component
     * @param newText The updated text
     */
    onSearchReplaceTextChanged(newText: string): void {
        this.jsonInput.setValue(newText);
        this.jsonInputEditor?.setValue(newText);
        this.validateJson();
    }

    onSearchReplaceActiveMatch(match: { start: number; length: number } | null): void {
        if (match) {
            this.jsonInputEditor?.revealDocumentOffsets(match.start, match.length);
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
                this.hasLoadedSharedJson = true;

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
     * Keeps SettingsService in sync when the formatting dialog opens/closes from the overlay.
     */
    onFormattingOptionsDialogToggle(): void {
        this.settingsService.toggleFormattingOptions();
    }

    /**
     * Applies formatting options from the dialog (indent values come from the dialog payload).
     */
    applyFormatting(options?: { indentSize: number; indentChar: string }): void {
        if (!this.isValidJson) {
            return;
        }

        if (options) {
            this.indentSize = options.indentSize;
            this.indentChar = options.indentChar;
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

            if (this.settingsService.getFormattingOptionsState()) {
                this.settingsService.toggleFormattingOptions();
            }
        } catch (error) {
            this.showError(`Error applying formatting: ${error instanceof Error ? error.message : String(error)}`);
        }
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

    private scheduleScrollSyncBind(): void {
        setTimeout(() => {
            this.teardownScrollSync();
            if (this.syncScrollEnabled) {
                this.setupScrollSync();
            }
        }, 400);
    }

    private setupScrollSync(): void {
        this.teardownScrollSync();
        if (!this.syncScrollEnabled || !this.canSearchOutputAce()) {
            return;
        }
        const inputEd = this.jsonInputEditor?.getAceEditor() ?? null;
        const outputEd = this.jsonOutputEditor?.getAceEditor() ?? null;
        if (!inputEd || !outputEd) {
            return;
        }

        const handlerIn = (): void => this.applyScrollSync(inputEd, outputEd);
        const handlerOut = (): void => this.applyScrollSync(outputEd, inputEd);

        const inSession = inputEd.session as unknown as { on: (ev: string, fn: () => void) => void; off: (ev: string, fn: () => void) => void };
        const outSession = outputEd.session as unknown as { on: (ev: string, fn: () => void) => void; off: (ev: string, fn: () => void) => void };
        inSession.on('changeScrollTop', handlerIn);
        outSession.on('changeScrollTop', handlerOut);
        this.scrollSyncCleanups.push(() => inSession.off('changeScrollTop', handlerIn));
        this.scrollSyncCleanups.push(() => outSession.off('changeScrollTop', handlerOut));
    }

    private teardownScrollSync(): void {
        for (const off of this.scrollSyncCleanups) {
            off();
        }
        this.scrollSyncCleanups = [];
    }

    private applyScrollSync(src: AceAjax.Editor, dst: AceAjax.Editor): void {
        if (this.suppressScrollSync) {
            return;
        }
        this.suppressScrollSync = true;
        try {
            const ratio = this.getEditorScrollRatio(src);
            this.setEditorScrollRatio(dst, ratio);
        } finally {
            requestAnimationFrame(() => {
                this.suppressScrollSync = false;
            });
        }
    }

    private getEditorScrollRatio(editor: AceAjax.Editor): number {
        const ed = editor as unknown as {
            getFirstVisibleRow: () => number;
            getLastVisibleRow: () => number;
            session: { getLength: () => number };
        };
        const first = ed.getFirstVisibleRow();
        const last = ed.getLastVisibleRow();
        const len = ed.session.getLength();
        const visibleRows = Math.max(1, last - first + 1);
        const maxFirst = Math.max(0, len - visibleRows);
        return maxFirst > 0 ? Math.min(1, Math.max(0, first / maxFirst)) : 0;
    }

    private setEditorScrollRatio(editor: AceAjax.Editor, ratio: number): void {
        const ed = editor as unknown as {
            getFirstVisibleRow: () => number;
            getLastVisibleRow: () => number;
            session: { getLength: () => number };
            scrollToLine: (row: number, center: boolean, animate: boolean, margin: number) => void;
        };
        const first = ed.getFirstVisibleRow();
        const last = ed.getLastVisibleRow();
        const visibleRows = Math.max(1, last - first + 1);
        const len = ed.session.getLength();
        const maxFirst = Math.max(0, len - visibleRows);
        const targetFirst = Math.floor(ratio * maxFirst);
        ed.scrollToLine(targetFirst, false, false, 0);
    }

    private updateFloatingSearchMatchCount(): void {
        const q = this.floatingSearchQuery.trim();
        if (!q || this.floatingSearchTarget === 'tree') {
            this.floatingSearchMatchCount = 0;
            return;
        }
        const text =
            this.floatingSearchTarget === 'input' ? this.jsonInput.value || '' : this.jsonOutput.value || '';
        this.floatingSearchMatchCount = this.countOccurrencesInsensitive(text, q);
    }

    private countOccurrencesInsensitive(haystack: string, needle: string): number {
        const esc = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(esc, 'gi');
        return (haystack.match(re) || []).length;
    }

    private focusQuerySelector(selector: string, delayMs = 100): void {
        setTimeout(() => {
            (document.querySelector(selector) as HTMLInputElement | null)?.focus();
        }, delayMs);
    }

    private resolveMaybeAsync<T>(
        result: T | Promise<T>,
        onSuccess: (value: T) => void,
        onError: (error: unknown) => void
    ): void {
        if (result instanceof Promise) {
            result.then(onSuccess).catch(onError);
        } else {
            onSuccess(result);
        }
    }

    private triggerBlobDownload(content: string, mimeType: string, filename: string): void {
        const blob = new Blob([content], {type: mimeType});
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
    }

    private runJsonTransform(transform: () => string, successMessage: string, errorLabel: string): void {
        try {
            this.applyTransformedJson(transform());
            this.showSuccess(successMessage);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            this.showError(`${errorLabel}: ${message}`);
        }
    }

    private applyTransformedJson(transformedJson: string): void {
        this.jsonInputEditor?.setValue(transformedJson);
        this.jsonInput.setValue(transformedJson);
        this.jsonOutput.setValue(transformedJson);
        this.validateJson();
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
