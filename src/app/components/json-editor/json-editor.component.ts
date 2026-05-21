import {AfterViewInit, Component, DestroyRef, HostListener, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {JsonService} from '../../services/json.service';
import {VersionHistoryService} from '../../services/history/version-history.service';
import {RecentFile, RecentFilesService} from '../../services/history/recent-files.service';
import {WorkspaceDraft, WorkspaceDraftService} from '../../services/history/workspace-draft.service';
import {InputHistoryLogService} from '../../services/history/input-history-log.service';
import {countJsonStructure, JsonStructureStats} from '../../utils/json-stats.util';
import {InputSanitizationService} from '../../services/security/input-sanitization.service';
import {SecurityUtilsService} from '../../services/security/security-utils.service';
import {JsonInputEditorComponent} from '../json-input-editor/json-input-editor.component';
import {JsonOutputEditorComponent} from '../json-output-editor/json-output-editor.component';
import {SettingsService} from '../../services/settings/settings.service';
import {ThemeService} from '../../services/theme/theme.service';
import {
    CsvOutputConversionStrategy,
    OutputConversionExecution,
    OutputConversionStrategy,
    OutputConversionType,
    XmlOutputConversionStrategy
} from './output-conversion.strategy';
import {JsonEditorUiHelper, PanelFocus} from './json-editor-ui.helper';
import {ShareDialogComponent, ShareDialogData} from '../share-dialog/share-dialog.component';
import {ShareService} from '../../services/share/share.service';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';
import {MICRO_INTERACTION_ANIMATIONS} from '../../animations/micro-interactions.animations';
import {KEYBOARD_SHORTCUTS} from '../../data/keyboard-shortcuts.data';
import {ConfigurationService} from '../../services/configuration.service';
import {DEFAULT_FORMATTING_OPTIONS, FormattingOptions} from '../../models/json-editor.models';
import {JsonValue} from '../../types/json.types';
import {
    BlueprintNode,
    MockDataGenerationMode,
    MockDataSimulatorOptions,
    MockDataStringStyle,
    StructureBlueprint
} from '../../types/mock-data.types';

/**
 * Coordinates JSON input/output editors, dialogs, and panels.
 * Persistence and algorithms live in services; this class wires UI state and user actions.
 */
@Component({
    selector: 'app-json-editor',
    templateUrl: './json-editor.component.html',
    styleUrls: ['./json-editor.component.scss'],
    animations: MICRO_INTERACTION_ANIMATIONS,
    standalone: false
})
export class JsonEditorComponent implements OnInit, AfterViewInit, OnDestroy {
    private static readonly DESKTOP_RESIZE_BREAKPOINT = 991;

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
    /** Exposed for template: disables panel width transition while dragging. */
    panelResizing = false;
    copyFeedbackState: 'idle' | 'copied' = 'idle';
    beautifyAnimState: 'idle' | 'active' = 'idle';
    private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;
    private beautifyAnimTimer: ReturnType<typeof setTimeout> | null = null;
    jsonStructureStats: JsonStructureStats | null = null;
    recentFiles: RecentFile[] = [];
    @ViewChild(JsonInputEditorComponent, {static: false}) jsonInputEditor!: JsonInputEditorComponent;
    @ViewChild(JsonOutputEditorComponent, {static: false}) jsonOutputEditor!: JsonOutputEditorComponent;
    jsonInput = new FormControl('');
    jsonOutput = new FormControl('');
    isValidJson = false;
    errorMessage = '';
    jsonErrorLine: number | null = null;
    showKeyboardShortcuts = false;
    showFeatures = false;
    isDarkTheme = false;
    showTreeView = false;
    jsonTreeData: any = null;
    expandedNodes: Set<string> = new Set();
    showFormattingOptions = false;
    formattingOptions: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS };

    keyboardShortcuts = KEYBOARD_SHORTCUTS;

    // Properties for new features
    yamlOutput = new FormControl('');
    jsonPaths: string[] = [];
    showJsonPaths = false;
    showYamlOutput = false;
    selectedOutputFormat: 'json' | 'yaml' = 'json';
    selectedViewMode: 'text' | 'tree' | 'table' = 'text';
    workspaceLayout: 'single' | 'dual' = 'dual';
    singlePaneFocus: 'input' | 'output' = 'input';
    isInputPanelFirst = true;

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
    compareError: string | null = null;

    // JSON path query properties
    jsonPathQuery = new FormControl('');
    showJsonPathQueryDialog = false;
    jsonPathQueryResult: string = '';

    // JSON visualization properties
    showJsonVisualize = false;

    // Mock data generator properties
    showMockDataSimulator = false;
    mockDataMode: MockDataGenerationMode = 'auto';
    mockDataSeed = new FormControl('json-beauty');
    mockDataArrayLength = new FormControl('');
    mockDataStringStyle: MockDataStringStyle = 'placeholder';
    mockDataStringPrefix = new FormControl('value_');
    mockDataNumberMin = new FormControl('');
    mockDataNumberMax = new FormControl('');
    mockDataFieldOverrides = new FormControl('{}');
    mockDataPreview = '';
    mockDataStatus: 'idle' | 'ready' | 'error' = 'idle';
    mockDataStatusMessage = '';
    mockDataGenerating = false;

    // Search and replace properties
    showSearchReplace = false;

    // Maximize/minimize properties
    isInputMaximized = false;
    isOutputMaximized = false;
    inputPanelWidth = 50;
    private hasLoadedSharedJson = false;
    private hasRestoredWorkspaceDraft = false;
    isFileDragActive = false;
    private dragEventDepth = 0;
    private historyLogSaveTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly historyLogDebounceMs = 2000;

    /** True when the input editor has no content (shows onboarding overlay). */
    get isWorkspaceEmpty(): boolean {
        return !(this.jsonInput.value || '').trim();
    }

    get isCompareInputValid(): boolean {
        const value = (this.compareJsonInput.value || '').trim();
        if (!value) {
            return true;
        }
        try {
            JSON.parse(value);
            return true;
        } catch {
            return false;
        }
    }
    private readonly outputConversionStrategies: Record<OutputConversionType, OutputConversionStrategy>;

    constructor(
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private jsonService: JsonService,
        private versionHistoryService: VersionHistoryService,
        private sanitizationService: InputSanitizationService,
        private securityUtils: SecurityUtilsService,
        private settingsService: SettingsService,
        private themeService: ThemeService,
        private shareService: ShareService,
        private recentFilesService: RecentFilesService,
        private workspaceDraftService: WorkspaceDraftService,
        private inputHistoryLogService: InputHistoryLogService,
        private configService: ConfigurationService,
        private destroyRef: DestroyRef
    ) {
        this.outputConversionStrategies = {
            csv: new CsvOutputConversionStrategy(this.jsonService),
            xml: new XmlOutputConversionStrategy(this.jsonService)
        };
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
        this.persistWorkspaceDraft(value);
        this.scheduleHistoryLogEntry(value);

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
        if (!this.hasValidNonEmptyInput()) {
            return;
        }

        this.versionHistoryService.addVersion(this.jsonInput.value || '', name);
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
        this.persistWorkspaceDraft(content);
    }

    /**
     * Loads JSON content from the optional history log.
     */
    loadHistoryEntryContent(content: string): void {
        this.loadVersionContent(content);
    }

    /**
     * Compares the current JSON against a selected history version.
     * @param versionContent JSON content from version history
     */
    compareWithVersionContent(versionContent: string): void {
        if (!versionContent || !this.hasValidNonEmptyInput()) {
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
        this.compareError = null;
        if (!options.silent) {
            this.showSuccess('Loaded latest saved version for comparison');
        }
        if (this.showJsonCompare && this.isValidJson) {
            this.compareJson();
        }
        return true;
    }

    /**
     * Opens compare dialog and runs comparison with latest different saved version.
     */
    quickDiffWithLatestVersion(): void {
        if (!this.hasValidNonEmptyInput()) {
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
        if (event.key !== 'Escape') {
            return;
        }
        if (this.floatingSearchOpen) {
            this.floatingSearchOpen = false;
            return;
        }
        if (this.showSearchReplace) {
            this.onSearchReplaceClose();
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
                if (this.isValidJson) {
                    this.beautifyJson();
                } else {
                    this.showError('Fix JSON syntax errors before beautifying (or use Lint & fix)');
                }
                break;
            case 'm':
                event.preventDefault();
                if (this.isValidJson) {
                    this.minifyJson();
                } else {
                    this.showError('Fix JSON syntax errors before minifying');
                }
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
        if (!this.isResizingPanels || !this.canResizePanels()) {
            return;
        }

        const viewportWidth = window.innerWidth;
        const nextWidth = (event.clientX / viewportWidth) * 100;
        this.inputPanelWidth = JsonEditorUiHelper.clampPanelWidth(nextWidth);
    }

    @HostListener('window:mouseup')
    stopPanelResize(): void {
        if (!this.isResizingPanels) {
            return;
        }

        this.isResizingPanels = false;
        this.panelResizing = false;
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
            setTimeout(() => {
                const el = document.querySelector('.floating-search-query') as HTMLInputElement | null;
                el?.focus();
                el?.select();
            }, 80);
        }
    }

    closeFloatingSearch(): void {
        this.floatingSearchOpen = false;
    }

    onFloatingSearchTargetChange(event: MatButtonToggleChange): void {
        const v = event.value as 'input' | 'output' | 'tree' | undefined;
        if (v) {
            this.floatingSearchTarget = v;
            this.scheduleFloatingSearch();
        }
    }

    onFloatingSearchQueryChange(_value: string): void {
        this.scheduleFloatingSearch();
    }

    private floatingSearchTimer: ReturnType<typeof setTimeout> | null = null;

    private scheduleFloatingSearch(): void {
        if (this.floatingSearchTimer) {
            clearTimeout(this.floatingSearchTimer);
        }
        this.floatingSearchTimer = setTimeout(() => {
            this.floatingSearchTimer = null;
            this.runFloatingSearch();
        }, 120);
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

    fetchJsonFromExternalUrl(): void {
        const input = window.prompt('Enter a URL that returns JSON');
        const trimmedInput = (input || '').trim();
        if (!trimmedInput) {
            return;
        }
        if (!this.securityUtils.validateUrl(trimmedInput)) {
            this.showError('Please enter a valid http(s) URL');
            return;
        }
        this.fetchJsonFromUrl(trimmedInput);
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
        return this.formatByteSize(new Blob([raw]).size);
    }

    get objectCount(): number | null {
        return this.jsonStructureStats?.objects ?? null;
    }

    get keyCount(): number | null {
        return this.jsonStructureStats?.keys ?? null;
    }

    formatRecentSize(bytes: number): string {
        return this.recentFilesService.formatSize(bytes);
    }

    private formatByteSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private updateStructureStats(jsonString: string): void {
        try {
            const parsed = JSON.parse(jsonString);
            this.jsonStructureStats = countJsonStructure(parsed);
        } catch {
            this.jsonStructureStats = null;
        }
    }

    ngOnDestroy(): void {
        if (this.historyLogSaveTimer) {
            clearTimeout(this.historyLogSaveTimer);
            this.historyLogSaveTimer = null;
        }
        this.workspaceDraftService.flush();
        if (this.floatingSearchTimer) {
            clearTimeout(this.floatingSearchTimer);
        }
        if (this.copyFeedbackTimer) {
            clearTimeout(this.copyFeedbackTimer);
        }
        if (this.beautifyAnimTimer) {
            clearTimeout(this.beautifyAnimTimer);
        }
        this.teardownScrollSync();
    }

    onBeautifyAnimationDone(): void {
        if (this.beautifyAnimState === 'active') {
            this.beautifyAnimState = 'idle';
        }
    }

    private triggerBeautifyAnimation(): void {
        if (this.beautifyAnimTimer) {
            clearTimeout(this.beautifyAnimTimer);
        }
        this.beautifyAnimState = 'idle';
        requestAnimationFrame(() => {
            this.beautifyAnimState = 'active';
            this.beautifyAnimTimer = setTimeout(() => {
                if (this.beautifyAnimState === 'active') {
                    this.beautifyAnimState = 'idle';
                }
            }, 700);
        });
    }

    openRecentFile(file: RecentFile): void {
        this.applyImportedJsonContent(file.content, `Opened "${file.name}"`, file.name);
    }

    removeRecentFile(event: Event, id: string): void {
        event.stopPropagation();
        this.recentFilesService.removeRecent(id);
    }

    clearRecentFiles(): void {
        this.recentFilesService.clearAll();
    }

    toggleKeyboardShortcuts(): void {
        // Delegate to the settings service
        this.settingsService.toggleKeyboardShortcuts();
    }

    startPanelResize(event: MouseEvent): void {
        if (!this.canResizePanels()) {
            return;
        }

        event.preventDefault();
        this.isResizingPanels = true;
        this.panelResizing = true;
        document.body.classList.add('resizing-panels');
    }

    /**
     * Toggles the maximized state of the input section
     */
    toggleInputMaximize(): void {
        this.togglePanelMaximize('input');
    }

    /**
     * Toggles the maximized state of the output section
     */
    toggleOutputMaximize(): void {
        this.togglePanelMaximize('output');
    }

    setWorkspaceLayout(layout: 'single' | 'dual'): void {
        this.workspaceLayout = layout;

        if (layout === 'single') {
            this.isInputMaximized = false;
            this.isOutputMaximized = false;
            this.syncScrollEnabled = false;
            this.teardownScrollSync();
            return;
        }

        this.scheduleScrollSyncBind();
    }

    setSinglePaneFocus(panel: 'input' | 'output'): void {
        this.singlePaneFocus = panel;
    }

    togglePanelPlacement(): void {
        this.isInputPanelFirst = !this.isInputPanelFirst;
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
            if (!this.tryUpdateTreeDataFromOutput()) {
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
        this.formattingOptions = this.configService.getFormattingOptions();
        this.jsonService.setFormattingPreferences(this.formattingOptions);

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

        this.recentFilesService.recentFiles$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(files => (this.recentFiles = files));

        // Check for JSON data in URL (for shared links), then restore cached workspace draft
        void this.loadJsonFromUrl().then(() => {
            if (this.hasLoadedSharedJson) {
                return;
            }

            const draft = this.workspaceDraftService.getDraft();
            if (draft?.jsonInput?.trim()) {
                this.restoreWorkspaceDraft(draft);
                return;
            }

            const sample = JSON.stringify(JsonEditorComponent.DEFAULT_SAMPLE_OBJECT, null, 2);
            this.jsonInput.setValue(sample);
            this.validateJson();
        });
    }

    @HostListener('window:beforeunload')
    onBeforeUnload(): void {
        this.workspaceDraftService.flush();
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

            if (this.hasRestoredWorkspaceDraft) {
                this.showSuccess('Restored your last session from local storage');
            }
        }, 100);
    }

    validateJson(): void {
        const jsonString = (this.jsonInput.value || '').trim();
        const result = this.jsonService.validateJson(jsonString);
        const {line, message} = this.buildInlineJsonError(result.errorMessage, jsonString);

        this.isValidJson = result.isValid;
        this.errorMessage = this.isValidJson ? '' : message;
        this.jsonErrorLine = this.isValidJson ? null : line;

        if (this.isValidJson) {
            this.updateStructureStats(jsonString);
            this.updateOutput();
        } else {
            this.jsonStructureStats = null;
            this.resetDerivedOutputState();

            // Disable tree view if it's active
            if (this.showTreeView) {
                this.showTreeView = false;
                this.selectedViewMode = 'text';
                this.showError('Tree view disabled due to invalid JSON');
            }
        }
    }

    private buildInlineJsonError(rawErrorMessage: string, jsonString: string): { line: number | null; message: string } {
        const firstLine = (rawErrorMessage || '').split('\n')[0]?.trim() || 'Invalid JSON';
        const line = this.extractErrorLine(rawErrorMessage, jsonString);

        if (line) {
            return {
                line,
                message: `Invalid JSON at line ${line}: ${firstLine}`
            };
        }

        return {
            line: null,
            message: firstLine.startsWith('Invalid JSON') ? firstLine : `Invalid JSON: ${firstLine}`
        };
    }

    private extractErrorLine(errorMessage: string, jsonString: string): number | null {
        const lineMatch = errorMessage.match(/line\s+(\d+)/i);
        if (lineMatch?.[1]) {
            return Number.parseInt(lineMatch[1], 10);
        }

        const positionMatch = errorMessage.match(/position\s+(\d+)/i);
        if (!positionMatch?.[1]) {
            return null;
        }

        const position = Number.parseInt(positionMatch[1], 10);
        if (!Number.isFinite(position) || position < 0) {
            return null;
        }

        const safePosition = Math.min(position, jsonString.length);
        return jsonString.slice(0, safePosition).split('\n').length;
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
                    error => this.showError(`Error converting YAML to JSON: ${this.toErrorMessage(error)}`)
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
                this.showError(`Error converting YAML to JSON: ${this.toErrorMessage(error)}`);
                // Stay in YAML mode if conversion fails
                this.selectedOutputFormat = 'yaml';
            }
        }
    }

    beautifyJson(): void {
        this.runJsonTransform(
            () => this.jsonService.beautifyJson(this.jsonInput.value || '{}'),
            'JSON beautified successfully',
            'Error beautifying JSON',
            true
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
        if (!this.isValidJson) {
            this.runJsonTransform(
                () => this.jsonService.repairLenientJson(this.jsonInput.value || ''),
                'Syntax repaired — converted to strict JSON',
                'Could not repair JSON syntax'
            );
            return;
        }
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
            const jsonString = (this.jsonInput.value || '').trim();
            try {
                const parsed = JSON.parse(jsonString);
                const formatted = this.jsonService.formatJson(jsonString, this.formattingOptions);
                this.jsonOutput.setValue(formatted);

                if (this.showTreeView) {
                    if (!this.tryUpdateTreeDataFromJsonString(jsonString)) {
                        this.showTreeView = false;
                        this.showError('Tree view disabled due to JSON parsing error');
                    }
                }

                this.updateJsonPaths();
                this.updateYamlOutput();
            } catch (error) {
                console.error('Error formatting JSON output:', error);
                this.isValidJson = false;
                this.resetDerivedOutputState();
            }
        } else {
            this.resetDerivedOutputState();
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
        this.convertUsingStrategy('csv');
    }

    /**
     * Converts JSON to XML and downloads it
     */
    convertToXml(): void {
        this.convertUsingStrategy('xml');
    }

    private convertUsingStrategy(type: OutputConversionType): void {
        const strategy = this.outputConversionStrategies[type];
        const execution = strategy.createExecution(this.jsonInput.value || '');
        this.convertAndDownload(execution);
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
            .then(() => {
                this.triggerCopyFeedback();
                this.showSuccess('Copied!');
            })
            .catch(err => this.showError('Failed to copy: ' + err));
    }

    onCopyAnimationDone(): void {
        if (this.copyFeedbackState === 'copied') {
            this.copyFeedbackState = 'idle';
        }
    }

    private triggerCopyFeedback(): void {
        if (this.copyFeedbackTimer) {
            clearTimeout(this.copyFeedbackTimer);
        }
        this.copyFeedbackState = 'copied';
        this.copyFeedbackTimer = setTimeout(() => {
            this.copyFeedbackTimer = null;
            if (this.copyFeedbackState === 'copied') {
                this.copyFeedbackState = 'idle';
            }
        }, 600);
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
        this.importJsonFile(file);
        event.target.value = '';
    }

    onWorkspaceDragEnter(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.hasFileDragPayload(event)) {
            return;
        }
        this.dragEventDepth += 1;
        this.isFileDragActive = true;
    }

    onWorkspaceDragOver(event: DragEvent): void {
        event.preventDefault();
        if (!this.hasFileDragPayload(event)) {
            return;
        }
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
        }
        this.isFileDragActive = true;
    }

    onWorkspaceDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        if (!this.hasFileDragPayload(event)) {
            return;
        }
        this.dragEventDepth = Math.max(0, this.dragEventDepth - 1);
        if (this.dragEventDepth === 0) {
            this.isFileDragActive = false;
        }
    }

    onWorkspaceDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.dragEventDepth = 0;
        this.isFileDragActive = false;
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) {
            return;
        }
        const jsonFile = Array.from(files).find(file => file.name.toLowerCase().endsWith('.json')) || files[0];
        this.importJsonFile(jsonFile);
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
     * Opens the mock data generator and auto-builds a preview when JSON is valid.
     */
    toggleMockDataSimulator(): void {
        this.showMockDataSimulator = !this.showMockDataSimulator;
        if (this.showMockDataSimulator) {
            this.updateMockDataPreview();
        }
    }

    /**
     * Regenerates preview with the current seed (does not replace editor input).
     */
    updateMockDataPreview(): void {
        const json = this.getValidJsonInputQuiet();
        if (!json) {
            this.mockDataStatus = 'error';
            this.mockDataStatusMessage = 'Paste valid JSON in the editor first.';
            this.mockDataPreview = '';
            return;
        }

        try {
            this.mockDataGenerating = true;
            const blueprint = this.jsonService.buildStructureBlueprint(json);
            this.mockDataPreview = this.jsonService.generateMockDataset(blueprint, this.buildMockDataOptions());
            this.mockDataStatus = 'ready';
            this.mockDataStatusMessage = this.describeBlueprint(blueprint);
        } catch (error) {
            this.mockDataStatus = 'error';
            this.mockDataStatusMessage = this.toErrorMessage(error);
            this.mockDataPreview = '';
        } finally {
            this.mockDataGenerating = false;
        }
    }

    /**
     * Applies generated mock data to the editor and refreshes the output.
     */
    generateMockData(): void {
        const json = this.getValidJsonInputQuiet();
        if (!json) {
            this.showError('Paste valid JSON in the editor before generating mock data');
            return;
        }

        try {
            this.mockDataGenerating = true;
            const mockJson = this.jsonService.generateMockDataFromJson(json, this.buildMockDataOptions());
            this.jsonInput.setValue(mockJson);
            this.mockDataPreview = mockJson;
            this.mockDataStatus = 'ready';
            this.validateJson();
            this.beautifyJson();
            this.showSuccess('Mock data applied to editor');
        } catch (error) {
            this.mockDataStatus = 'error';
            this.mockDataStatusMessage = this.toErrorMessage(error);
            this.showError(`Mock generation failed: ${this.toErrorMessage(error)}`);
        } finally {
            this.mockDataGenerating = false;
        }
    }

    shuffleMockDataSeed(): void {
        const seed = `run-${Date.now().toString(36)}`;
        this.mockDataSeed.setValue(seed);
        this.updateMockDataPreview();
    }

    setMockDataMode(mode: MockDataGenerationMode): void {
        this.mockDataMode = mode;
        this.updateMockDataPreview();
    }

    setMockDataStringStyle(style: MockDataStringStyle): void {
        this.mockDataStringStyle = style;
        this.updateMockDataPreview();
    }

    private buildMockDataOptions(): MockDataSimulatorOptions {
        const seed = (this.mockDataSeed.value || 'json-beauty').trim();
        const lengthRaw = (this.mockDataArrayLength.value || '').trim();
        const parsedLength = lengthRaw ? Number.parseInt(lengthRaw, 10) : Number.NaN;
        const options: MockDataSimulatorOptions = {
            seed: seed.length > 0 ? seed : 'json-beauty',
            mode: this.mockDataMode
        };
        if (Number.isFinite(parsedLength) && parsedLength > 0) {
            options.arrayLength = parsedLength;
        }
        if (this.mockDataMode === 'custom') {
            options.custom = {
                stringStyle: this.mockDataStringStyle,
                stringPrefix: (this.mockDataStringPrefix.value || 'value_').trim() || 'value_',
                ...this.parseOptionalNumberRange(),
                fieldOverrides: this.parseFieldOverrides()
            };
        }
        return options;
    }

    private parseOptionalNumberRange(): { numberMin?: number; numberMax?: number } {
        const minRaw = (this.mockDataNumberMin.value || '').trim();
        const maxRaw = (this.mockDataNumberMax.value || '').trim();
        const min = minRaw ? Number.parseInt(minRaw, 10) : Number.NaN;
        const max = maxRaw ? Number.parseInt(maxRaw, 10) : Number.NaN;
        const out: { numberMin?: number; numberMax?: number } = {};
        if (Number.isFinite(min)) {
            out.numberMin = min;
        }
        if (Number.isFinite(max)) {
            out.numberMax = max;
        }
        return out;
    }

    private parseFieldOverrides(): Record<string, JsonValue> | undefined {
        const raw = (this.mockDataFieldOverrides.value || '').trim();
        if (!raw || raw === '{}') {
            return undefined;
        }
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, JsonValue>;
            }
            throw new Error('Overrides must be a JSON object');
        } catch (error) {
            throw new Error(
                `Invalid field overrides: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    private getValidJsonInputQuiet(): string | null {
        const value = (this.jsonInput.value || '').trim();
        if (!value) {
            return null;
        }
        return this.jsonService.validateJson(value).isValid ? value : null;
    }

    private describeBlueprint(blueprint: StructureBlueprint): string {
        let fields = 0;
        let arrays = 0;
        const walk = (node: BlueprintNode): void => {
            if (node.kind === 'object' && node.properties) {
                for (const child of Object.values(node.properties)) {
                    fields++;
                    walk(child);
                }
            } else if (node.kind === 'array') {
                arrays++;
                if (node.itemTemplate) {
                    walk(node.itemTemplate);
                }
            }
        };
        walk(blueprint.root);
        const modeLabel = this.mockDataMode === 'auto' ? 'Auto' : 'Custom';
        return `Ready (${modeLabel}) — ${fields} fields, ${arrays} arrays · same seed = same data`;
    }

    /**
     * Generates a JSON schema from the current JSON data
     */
    generateJsonSchema(): void {
        if (!this.ensureValidJsonInput('Please enter valid JSON to generate a schema')) {
            return;
        }

        try {
            // Generate the schema
            const schema = this.jsonService.generateJsonSchema(this.jsonInput.value || '');

            // Set the schema to the schema input
            this.schemaInput.setValue(schema);

            // Show the schema editor
            this.showSchemaEditor = true;

            this.showSuccess('JSON schema generated successfully');
        } catch (error) {
            this.showError(`Error generating JSON schema: ${this.toErrorMessage(error)}`);
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
        if (!this.ensureValidJsonInput('Please enter valid JSON to query')) {
            return;
        }

        if (!this.jsonPathQuery.value) {
            this.showError('Please enter a JSONPath query');
            return;
        }

        try {
            // Execute the query
            this.jsonPathQueryResult = this.jsonService.queryJsonPath(
                this.jsonInput.value || '',
                this.jsonPathQuery.value
            );

            this.showSuccess('JSONPath query executed successfully');
        } catch (error) {
            this.showError(`Error executing JSONPath query: ${this.toErrorMessage(error)}`);
            this.jsonPathQueryResult = '';
        }
    }

    /**
     * Toggles the JSON comparison dialog
     */
    toggleJsonCompare(): void {
        this.showJsonCompare = !this.showJsonCompare;

        if (!this.showJsonCompare) {
            this.compareError = null;
            return;
        }

        if (!this.compareJsonInput.value) {
            this.useLatestVersionForCompare({silent: true});
        }

        if ((this.compareJsonInput.value || '').trim() && this.isValidJson) {
            this.compareJson();
        }
    }

    /**
     * Compares the current JSON with another JSON document
     */
    compareJson(): void {
        this.compareError = null;
        this.jsonDiffResult = null;

        if (!this.ensureValidJsonInput('Please enter valid JSON in the editor before comparing')) {
            this.compareError = 'Editor JSON is invalid. Fix it before comparing.';
            return;
        }

        const compareValue = (this.compareJsonInput.value || '').trim();
        if (!compareValue) {
            this.compareError = 'Paste JSON to compare against, or load a saved version.';
            return;
        }

        if (!this.isCompareInputValid) {
            this.compareError = 'Compare JSON is invalid. Fix syntax before comparing.';
            return;
        }

        try {
            this.jsonDiffResult = this.jsonService.compareJson(
                this.jsonInput.value || '',
                compareValue
            );
        } catch (error) {
            this.compareError = `Error comparing JSON: ${this.toErrorMessage(error)}`;
            this.jsonDiffResult = null;
        }
    }

    /**
     * Swaps editor JSON with compare JSON and re-runs comparison when possible.
     */
    swapCompareSides(): void {
        const compareValue = (this.compareJsonInput.value || '').trim();
        if (!compareValue) {
            this.compareError = 'Nothing to swap — add JSON in the compare pane first.';
            return;
        }

        const current = this.jsonInput.value || '';
        this.jsonInput.setValue(compareValue);
        if (this.jsonInputEditor) {
            this.jsonInputEditor.setValue(compareValue);
        }
        this.compareJsonInput.setValue(current);
        this.validateJson();
        this.updateOutput();
        this.compareError = null;

        if (this.showJsonCompare && this.isValidJson && current.trim()) {
            this.compareJson();
        }
    }

    /**
     * Beautifies JSON in the compare input field.
     */
    formatCompareInput(): void {
        const value = (this.compareJsonInput.value || '').trim();
        if (!value) {
            this.compareError = 'Nothing to format in the compare pane.';
            return;
        }

        try {
            this.compareJsonInput.setValue(this.jsonService.beautifyJson(value));
            this.compareError = null;
        } catch (error) {
            this.compareError = `Cannot format compare JSON: ${this.toErrorMessage(error)}`;
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

    onSearchReplaceClose(): void {
        this.settingsService.closeSearchReplace();
        this.jsonInputEditor?.clearSearch();
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
     * Generates a shareable URL containing the current JSON and opens the share dialog.
     * Everything remains client-side; no server storage is used.
     */
    shareJson(): void {
        if (!this.isValidJson) {
            this.showError('Cannot share invalid JSON');
            return;
        }

        void this.openShareDialog();
    }

    private async openShareDialog(): Promise<void> {
        try {
            const sanitizedInput = this.sanitizationService.sanitizeJsonInput(this.jsonInput.value || '{}');
            const jsonString = this.jsonService.minifyJson(sanitizedInput);
            const result = await this.shareService.buildShareUrl(jsonString);

            window.history.replaceState({}, '', result.url);
            this.saveVersion('Shared version');

            const dialogData: ShareDialogData = {
                shareableUrl: result.url,
                jsonContent: jsonString,
                compressed: result.compressed,
                compressionSupported: result.compressionSupported
            };

            this.dialog.open(ShareDialogComponent, {
                width: '600px',
                maxWidth: '95vw',
                maxHeight: '90vh',
                autoFocus: true,
                data: dialogData
            });
        } catch (error) {
            const sanitizedError = this.sanitizationService.sanitizeString(this.toErrorMessage(error));
            this.showError(`Error generating shareable URL: ${sanitizedError}`);
        }
    }

    /**
     * Loads JSON data from the URL query parameter (`json` or compressed `jc`).
     */
    async loadJsonFromUrl(): Promise<void> {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.has('json') && !urlParams.has('jc')) {
                return;
            }

            const decodedJson = await this.shareService.extractJsonFromSearchParams(urlParams);
            if (!decodedJson) {
                return;
            }

            const sanitizedJson = this.sanitizationService.sanitizeJsonInput(decodedJson);
            JSON.parse(sanitizedJson);

            this.jsonInput.setValue(sanitizedJson);
            this.hasLoadedSharedJson = true;
            this.persistWorkspaceDraft(sanitizedJson);

            setTimeout(() => {
                if (this.jsonInputEditor) {
                    this.jsonInputEditor.setValue(sanitizedJson);
                }
                this.beautifyJson();
                this.inputHistoryLogService.addEntry(sanitizedJson, 'shared link');
                this.showSuccess('JSON loaded from shared link');
            }, 100);
        } catch (error) {
            const sanitizedError = this.sanitizationService.sanitizeString(this.toErrorMessage(error));
            this.showError(`Error loading JSON from link: ${sanitizedError}`);
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
    applyFormatting(options?: FormattingOptions): void {
        if (!this.isValidJson) {
            return;
        }

        if (options) {
            this.formattingOptions = { ...options };
        }

        try {
            this.configService.updateFormattingOptions(this.formattingOptions);
            this.jsonService.setFormattingPreferences(this.formattingOptions);

            const formatted = this.jsonService.formatJson(
                this.jsonInput.value || '{}',
                this.formattingOptions
            );

            this.jsonOutput.setValue(formatted);
            this.jsonInput.setValue(formatted);

            this.showSuccess('Formatting options applied');

            if (this.settingsService.getFormattingOptionsState()) {
                this.settingsService.toggleFormattingOptions();
            }
        } catch (error) {
            this.showError(`Error applying formatting: ${this.toErrorMessage(error)}`);
        }
    }

    /**
     * Initializes the JSON visualization from the current editor input.
     */
    private initializeVisualization(): void {
        if (!this.ensureValidJsonInput('Please enter valid JSON to visualize')) {
            this.showJsonVisualize = false;
            return;
        }

        try {
            const parsed = this.tryUpdateTreeDataFromJsonString(this.jsonInput.value || '');
            if (!parsed) {
                this.showError('Could not parse JSON for visualization');
                this.showJsonVisualize = false;
            }
        } catch (error) {
            this.showError(`Error initializing visualization: ${this.toErrorMessage(error)}`);
            this.showJsonVisualize = false;
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

    private runJsonTransform(
        transform: () => string,
        successMessage: string,
        errorLabel: string,
        animateBeautify = false
    ): void {
        try {
            this.applyTransformedJson(transform());
            if (animateBeautify) {
                this.triggerBeautifyAnimation();
            }
            this.showSuccess(successMessage);
        } catch (error: unknown) {
            this.showError(`${errorLabel}: ${this.toErrorMessage(error)}`);
        }
    }

    private applyTransformedJson(transformedJson: string): void {
        this.jsonInputEditor?.setValue(transformedJson);
        this.jsonInput.setValue(transformedJson);
        this.validateJson();
    }

    private hasValidNonEmptyInput(): boolean {
        return this.isValidJson && !!this.jsonInput.value;
    }

    private ensureValidJsonInput(errorMessage: string): boolean {
        if (this.hasValidNonEmptyInput()) {
            return true;
        }
        this.showError(errorMessage);
        return false;
    }

    private toErrorMessage(error: unknown): string {
        return error instanceof Error ? error.message : String(error);
    }

    private canResizePanels(): boolean {
        return window.innerWidth > JsonEditorComponent.DESKTOP_RESIZE_BREAKPOINT;
    }

    private togglePanelMaximize(panel: 'input' | 'output'): void {
        const nextState = JsonEditorUiHelper.applyPanelMaximize(
            {
                workspaceLayout: this.workspaceLayout,
                singlePaneFocus: this.singlePaneFocus,
                isInputMaximized: this.isInputMaximized,
                isOutputMaximized: this.isOutputMaximized
            },
            panel as PanelFocus
        );

        this.singlePaneFocus = nextState.singlePaneFocus;
        this.isInputMaximized = nextState.isInputMaximized;
        this.isOutputMaximized = nextState.isOutputMaximized;
    }

    private resetDerivedOutputState(): void {
        this.jsonOutput.setValue('');
        this.yamlOutput.setValue('');
        this.jsonPaths = [];
        this.jsonTreeData = null;
        this.jsonOutputEditor?.clearOutput();
    }

    private tryUpdateTreeDataFromOutput(): boolean {
        return this.tryUpdateTreeDataFromJsonString(this.jsonOutput.value || '{}');
    }

    private tryUpdateTreeDataFromJsonString(jsonString: string): boolean {
        const parseResult = JsonEditorUiHelper.tryParseTreeData(jsonString);
        if (parseResult.success) {
            this.jsonTreeData = parseResult.value;
            this.expandedNodes.clear();
            this.expandedNodes.add(JsonEditorUiHelper.DEFAULT_ROOT_TREE_NODE);
            return true;
        }
        this.jsonTreeData = parseResult.value;
        return false;
    }

    private convertAndDownload(options: OutputConversionExecution): void {
        if (!this.hasValidNonEmptyInput()) {
            this.showError(options.invalidInputMessage);
            return;
        }

        const onSuccess = (output: string): void => {
            if (!output) {
                this.showError(options.emptyResultMessage);
                return;
            }
            this.triggerBlobDownload(output, options.mimeType, options.filename);
            this.showSuccess(options.successMessage);
        };

        const onError = (error: unknown): void => {
            this.showError(`${options.errorLabel}: ${this.toErrorMessage(error)}`);
        };

        try {
            this.resolveMaybeAsync(options.convert(), onSuccess, onError);
        } catch (error) {
            onError(error);
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

    private hasFileDragPayload(event: DragEvent): boolean {
        const types = event.dataTransfer?.types;
        if (!types) {
            return false;
        }
        return Array.from(types).includes('Files');
    }

    private fetchJsonFromUrl(url: string): void {
        fetch(url, {
            method: 'GET',
            headers: {Accept: 'application/json, text/plain, */*'}
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }
                return response.text();
            })
            .then(content => {
                this.applyImportedJsonContent(content, `Fetched JSON from ${url}`);
            })
            .catch(error => {
                this.showError(`Could not fetch JSON from URL: ${this.toErrorMessage(error)}`);
            });
    }

    private importJsonFile(file: File): void {
        const allowedTypes = ['application/json', 'text/plain', 'text/json', 'application/x-javascript'];
        const maxFileSize = 5 * 1024 * 1024;
        if (!this.securityUtils.validateFile(file, allowedTypes, maxFileSize)) {
            this.showError('Invalid file: Only JSON files up to 5MB are allowed');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            const content = typeof event.target?.result === 'string' ? event.target.result : '';
            if (!content) {
                this.showError('Imported file is empty');
                return;
            }
            const safeName = this.sanitizationService.sanitizeString(file.name);
            this.applyImportedJsonContent(content, `File "${safeName}" imported successfully`, safeName);
        };
        reader.onerror = () => {
            this.showError('Error reading file');
        };
        reader.readAsText(file);
    }

    private applyImportedJsonContent(content: string, successMessage: string, sourceName = 'JSON input'): void {
        try {
            const sanitizedContent = this.sanitizationService.sanitizeFileContent(content, 'json');
            const parsedJson = JSON.parse(sanitizedContent);
            const normalizedJson = this.jsonService.formatJson(
                JSON.stringify(parsedJson),
                this.formattingOptions
            );
            this.jsonInputEditor?.setValue(normalizedJson);
            this.jsonInput.setValue(normalizedJson);
            this.validateJson();
            this.updateOutput();
            this.recentFilesService.addRecent(sourceName, normalizedJson);
            this.persistWorkspaceDraft(normalizedJson);
            this.inputHistoryLogService.addEntry(normalizedJson, sourceName);
            this.showSuccess(successMessage);
        } catch (error) {
            const sanitizedError = this.sanitizationService.sanitizeString(this.toErrorMessage(error));
            this.showError(`Error importing ${sourceName}: ${sanitizedError}`);
        }
    }

    private restoreWorkspaceDraft(draft: WorkspaceDraft): void {
        this.jsonInput.setValue(draft.jsonInput);
        if (draft.compareJsonInput) {
            this.compareJsonInput.setValue(draft.compareJsonInput);
        }
        if (draft.schemaInput) {
            this.schemaInput.setValue(draft.schemaInput);
        }
        this.hasRestoredWorkspaceDraft = true;
        this.validateJson();
    }

    private persistWorkspaceDraft(value = this.jsonInput.value || ''): void {
        if (!value.trim()) {
            return;
        }

        this.workspaceDraftService.scheduleSave({
            jsonInput: value,
            compareJsonInput: this.compareJsonInput.value || undefined,
            schemaInput: this.schemaInput.value || undefined
        });
    }

    private scheduleHistoryLogEntry(value: string, source = 'typed'): void {
        if (!value.trim()) {
            return;
        }

        if (this.historyLogSaveTimer) {
            clearTimeout(this.historyLogSaveTimer);
        }

        this.historyLogSaveTimer = setTimeout(() => {
            this.inputHistoryLogService.addEntry(value, source);
            this.historyLogSaveTimer = null;
        }, this.historyLogDebounceMs);
    }
}
