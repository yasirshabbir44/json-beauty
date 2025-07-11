import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonService } from '../../services/json.service';
import * as ace from 'ace-builds';
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
export class JsonEditorComponent implements OnInit {
  @ViewChild('editor', { static: true }) editorElement!: ElementRef;
  @ViewChild('outputEditor', { static: true }) outputEditorElement!: ElementRef;

  editor: any;
  outputEditor: any;
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
    { key: 'Ctrl + F', action: 'Show/Hide Search Bar' },
    { key: 'Ctrl + B', action: 'Beautify JSON' },
    { key: 'Ctrl + M', action: 'Minify JSON' },
    { key: 'Ctrl + L', action: 'Lint & Fix JSON' },
    { key: 'Ctrl + C', action: 'Copy to Clipboard' },
    { key: 'Ctrl + S', action: 'Download JSON' },
    { key: 'Ctrl + D', action: 'Clear Editor' },
    { key: 'Ctrl + K', action: 'Show/Hide Keyboard Shortcuts' },
    { key: 'Ctrl + 1', action: 'Maximize/Minimize Input' },
    { key: 'Ctrl + 2', action: 'Maximize/Minimize Output' }
  ];

  // Properties for new features
  yamlOutput = new FormControl('');
  jsonPaths: string[] = [];
  showJsonPaths = false;
  showYamlOutput = false;
  selectedOutputFormat: 'json' | 'yaml' = 'json';

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

  // Maximize/minimize properties
  isInputMaximized = false;
  isOutputMaximized = false;

  constructor(private snackBar: MatSnackBar, private jsonService: JsonService) {
    // Listen for dark mode changes
    document.body.addEventListener('DOMSubtreeModified', () => {
      this.updateEditorTheme();
      this.updateOutputEditorTheme();
    });
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
          // Only handle if we're not in the editor (let browser handle copy in editor)
          if (document.activeElement !== this.editorElement.nativeElement) {
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
    // Determine which editor is active or toggle both if none is specifically active
    const activeElement = document.activeElement;

    if (this.editorElement && this.editorElement.nativeElement.contains(activeElement)) {
      // Input editor is active
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
    } else if (this.outputEditorElement && this.outputEditorElement.nativeElement.contains(activeElement)) {
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
      // No specific editor is active, toggle all search bars off
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
    this.updateEditorTheme();
    this.updateOutputEditorTheme();
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

    // Resize the editor after the UI has updated
    setTimeout(() => {
      if (this.editor) {
        this.editor.resize();
      }
    }, 100);
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

    // Resize the editor after the UI has updated
    setTimeout(() => {
      if (this.outputEditor) {
        this.outputEditor.resize();
      }
    }, 100);
  }

  /**
   * Toggles between text and tree views
   */
  toggleTreeView(): void {
    this.showTreeView = !this.showTreeView;

    if (this.showTreeView && this.isValidJson) {
      try {
        // Parse the JSON to create the tree data
        this.jsonTreeData = JSON.parse(this.jsonOutput.value || '{}');
      } catch (error) {
        this.showError('Error parsing JSON for tree view');
        this.showTreeView = false;
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

    this.initializeEditor();

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
    this.updateOutput();
  }

  initializeEditor(): void {
    ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.32.0/src-noconflict/');

    // Initialize input editor
    this.editor = ace.edit(this.editorElement.nativeElement);
    this.updateEditorTheme();
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
      fadeFoldWidgets: true,
      highlightSelectedWord: true,
      displayIndentGuides: true
    });

    // Enable real-time syntax error highlighting
    this.editor.getSession().setUseWorker(true);

    this.editor.on('change', () => {
      this.jsonInput.setValue(this.editor.getValue());
      this.validateJson();
    });

    // Initialize output editor
    this.outputEditor = ace.edit(this.outputEditorElement.nativeElement);
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
      fadeFoldWidgets: true,
      highlightSelectedWord: true,
      displayIndentGuides: true
    });

    // Disable syntax error highlighting for output editor
    this.outputEditor.getSession().setUseWorker(false);
  }

  updateEditorTheme(): void {
    if (this.editor) {
      const isDarkMode = document.body.classList.contains('dark-theme');
      this.editor.setTheme(isDarkMode ? 'ace/theme/dracula' : 'ace/theme/github');
    }
  }

  updateOutputEditorTheme(): void {
    if (this.outputEditor) {
      const isDarkMode = document.body.classList.contains('dark-theme');
      this.outputEditor.setTheme(isDarkMode ? 'ace/theme/dracula' : 'ace/theme/github');
    }
  }

  validateJson(): void {
    const jsonString = this.jsonInput.value || '';
    const result = this.jsonService.validateJson(jsonString);

    this.isValidJson = result.isValid;
    this.errorMessage = result.errorMessage;

    if (this.isValidJson) {
      // If JSON is valid, update paths and YAML output
      this.updateJsonPaths();
      this.updateYamlOutput();
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
      const yamlString = this.jsonService.jsonToYaml(this.jsonInput.value || '');
      this.yamlOutput.setValue(yamlString);
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
    this.selectedOutputFormat = this.selectedOutputFormat === 'json' ? 'yaml' : 'json';
    if (this.selectedOutputFormat === 'yaml' && !this.yamlOutput.value) {
      this.updateYamlOutput();
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

  beautifyJson(): void {
    if (!this.isValidJson) {
      this.showError('Cannot beautify invalid JSON');
      return;
    }

    try {
      const beautified = this.jsonService.beautifyJson(this.jsonInput.value || '{}');
      this.editor.setValue(beautified, -1);
      this.jsonOutput.setValue(beautified);

      // Update the output editor
      if (this.outputEditor) {
        this.outputEditor.setValue(beautified, -1);
      }

      this.showSuccess('JSON beautified successfully');
    } catch (e: any) {
      this.showError('Error beautifying JSON: ' + e.message);
    }
  }

  minifyJson(): void {
    if (!this.isValidJson) {
      this.showError('Cannot minify invalid JSON');
      return;
    }

    try {
      const minified = this.jsonService.minifyJson(this.jsonInput.value || '{}');
      this.jsonOutput.setValue(minified);

      // Update the output editor
      if (this.outputEditor) {
        this.outputEditor.setValue(minified, -1);
      }

      this.showSuccess('JSON minified successfully');
    } catch (e: any) {
      this.showError('Error minifying JSON: ' + e.message);
    }
  }

  lintJson(): void {
    if (!this.isValidJson) {
      this.showError('Cannot lint invalid JSON');
      return;
    }

    try {
      const linted = this.jsonService.lintJson(this.jsonInput.value || '{}');
      this.editor.setValue(linted, -1);
      this.jsonOutput.setValue(linted);

      // Update the output editor
      if (this.outputEditor) {
        this.outputEditor.setValue(linted, -1);
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

  updateOutput(): void {
    if (this.isValidJson) {
      const jsonString = this.jsonInput.value || '';
      this.jsonOutput.setValue(jsonString);

      // Update the output editor with the formatted JSON
      if (this.outputEditor) {
        this.outputEditor.setValue(jsonString, -1);
        // Fold all arrays and objects for better readability
        this.outputEditor.getSession().foldAll(2); // Start folding from depth 2
      }

      // Update tree view data if tree view is active
      if (this.showTreeView) {
        try {
          this.jsonTreeData = JSON.parse(jsonString);
          // Reset expanded nodes when JSON changes
          this.expandedNodes.clear();
        } catch (error) {
          this.jsonTreeData = null;
        }
      }

      this.updateJsonPaths();
      this.updateYamlOutput();
    } else {
      this.jsonOutput.setValue('');
      if (this.outputEditor) {
        this.outputEditor.setValue('', -1);
      }
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
   * Downloads the YAML output
   */
  downloadYaml(): void {
    if (!this.yamlOutput.value) {
      this.showError('Nothing to download');
      return;
    }

    const blob = new Blob([this.yamlOutput.value], { type: 'application/yaml' });
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

    const blob = new Blob([this.jsonOutput.value], { type: 'application/json' });
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
    this.editor.setValue('', -1);
    this.jsonInput.setValue('');
    this.jsonOutput.setValue('');
    this.isValidJson = false;
    this.errorMessage = 'JSON is empty';
    this.schemaValidationResult = null;
  }

  /**
   * Imports JSON from a file
   * @param event The file input change event
   */
  importFile(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Try to parse the file content to validate it's JSON
        JSON.parse(content);

        // Set the editor value
        this.editor.setValue(content, -1);
        this.jsonInput.setValue(content);
        this.validateJson();
        this.updateOutput();

        this.showSuccess(`File "${file.name}" imported successfully`);
      } catch (error) {
        this.showError(`Error importing file: ${error instanceof Error ? error.message : String(error)}`);
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
   * Searches for text in the JSON editor (input or output)
   * @param searchText The text to search for
   * @param editorType The editor to search in ('input' or 'output')
   */
  searchInJson(searchText: string, editorType: 'input' | 'output' = 'output'): void {
    if (!searchText) {
      this.clearSearch(editorType);
      return;
    }

    const targetEditor = editorType === 'input' ? this.editor : this.outputEditor;

    if (targetEditor) {
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

      const range = searchInstance.find(targetEditor.getSession());
      if (range) {
        targetEditor.focus();
      } else {
        this.showError(`No matches found for "${searchText}" in ${editorType} editor`);
      }
    }
  }

  /**
   * Finds the next occurrence of the search text
   * @param editorType The editor to search in ('input' or 'output')
   */
  findNext(editorType: 'input' | 'output' = 'output'): void {
    const targetEditor = editorType === 'input' ? this.editor : this.outputEditor;
    if (targetEditor) {
      targetEditor.findNext();
    }
  }

  /**
   * Finds the previous occurrence of the search text
   * @param editorType The editor to search in ('input' or 'output')
   */
  findPrevious(editorType: 'input' | 'output' = 'output'): void {
    const targetEditor = editorType === 'input' ? this.editor : this.outputEditor;
    if (targetEditor) {
      targetEditor.findPrevious();
    }
  }

  /**
   * Clears the search highlighting
   * @param editorType The editor to clear search in ('input' or 'output')
   */
  clearSearch(editorType: 'input' | 'output' = 'output'): void {
    const targetEditor = editorType === 'input' ? this.editor : this.outputEditor;
    if (targetEditor) {
      targetEditor.execCommand('clearSelection');
    }
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
          "name": { "type": "string" },
          "version": { "type": "string" },
          "description": { "type": "string" },
          "features": {
            "type": "array",
            "items": { "type": "string" }
          },
          "isAwesome": { "type": "boolean" },
          "numberOfUsers": { "type": "number" }
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
      this.schemaValidationResult = this.jsonService.validateJsonSchema(
        this.jsonInput.value || '{}',
        this.schemaInput.value
      );

      if (this.schemaValidationResult.isValid) {
        this.showSuccess('JSON is valid against the schema');
      } else {
        this.showError('JSON does not match the schema');
      }
    } catch (e: any) {
      this.showError('Error validating against schema: ' + e.message);
      this.schemaValidationResult = {
        isValid: false,
        errors: [{ message: e.message }]
      };
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }

  getJsonSize(): string {
    const editorValue = this.editor?.getValue() || '';
    const charCount = editorValue.length;

    if (charCount < 1000) {
      return charCount.toString();
    } else if (charCount < 1000000) {
      return (charCount / 1000).toFixed(1) + 'K';
    } else {
      return (charCount / 1000000).toFixed(1) + 'M';
    }
  }

  /**
   * Tree View Helper Methods
   */

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
   * Generates a shareable URL with the current JSON data
   */
  shareJson(): void {
    if (!this.isValidJson) {
      this.showError('Cannot share invalid JSON');
      return;
    }

    try {
      // Compress the JSON to make the URL shorter
      const jsonString = this.jsonService.minifyJson(this.jsonInput.value || '{}');

      // Encode the JSON for the URL
      const encodedJson = encodeURIComponent(jsonString);

      // Create the URL with the JSON data as a query parameter
      const baseUrl = window.location.href.split('?')[0];
      const shareableUrl = `${baseUrl}?json=${encodedJson}`;

      // Copy the URL to the clipboard
      navigator.clipboard.writeText(shareableUrl)
        .then(() => {
          this.showSuccess('Shareable URL copied to clipboard');
        })
        .catch(err => {
          this.showError('Failed to copy URL: ' + err);
        });
    } catch (error) {
      this.showError(`Error generating shareable URL: ${error instanceof Error ? error.message : String(error)}`);
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

        // Try to parse the JSON to validate it
        JSON.parse(decodedJson);

        // Set the editor value
        this.editor.setValue(decodedJson, -1);
        this.jsonInput.setValue(decodedJson);

        // Beautify the JSON for better readability
        this.beautifyJson();

        this.showSuccess('JSON loaded from shared URL');
      }
    } catch (error) {
      this.showError(`Error loading JSON from URL: ${error instanceof Error ? error.message : String(error)}`);
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

      // Update the output editor
      if (this.outputEditor) {
        this.outputEditor.setValue(formatted, -1);
      }

      this.showSuccess('Formatting options applied');
    } catch (error) {
      this.showError(`Error applying formatting: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
