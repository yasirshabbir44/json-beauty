import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { JsonService } from '../../services/json.service';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';

@Component({
  selector: 'app-json-editor',
  templateUrl: './json-editor.component.html',
  styleUrls: ['./json-editor.component.scss']
})
export class JsonEditorComponent implements OnInit {
  @ViewChild('editor', { static: true }) editorElement!: ElementRef;

  editor: any;
  jsonInput = new FormControl('');
  jsonOutput = new FormControl('');
  isValidJson = true;
  errorMessage = '';
  showKeyboardShortcuts = false;
  showFeatures = false;

  // Keyboard shortcuts
  keyboardShortcuts = [
    { key: 'Ctrl + B', action: 'Beautify JSON' },
    { key: 'Ctrl + M', action: 'Minify JSON' },
    { key: 'Ctrl + L', action: 'Lint & Fix JSON' },
    { key: 'Ctrl + C', action: 'Copy to Clipboard' },
    { key: 'Ctrl + S', action: 'Download JSON' },
    { key: 'Ctrl + D', action: 'Clear Editor' },
    { key: 'Ctrl + K', action: 'Show/Hide Keyboard Shortcuts' }
  ];

  // Properties for new features
  yamlOutput = new FormControl('');
  jsonPaths: string[] = [];
  showJsonPaths = false;
  showYamlOutput = false;
  selectedOutputFormat: 'json' | 'yaml' = 'json';

  constructor(private snackBar: MatSnackBar, private jsonService: JsonService) {
    // Listen for dark mode changes
    document.body.addEventListener('DOMSubtreeModified', () => {
      this.updateEditorTheme();
    });
  }

  // Listen for keyboard shortcuts
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Only process if Ctrl key is pressed
    if (event.ctrlKey) {
      switch (event.key.toLowerCase()) {
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
      }
    }
  }

  toggleKeyboardShortcuts(): void {
    this.showKeyboardShortcuts = !this.showKeyboardShortcuts;
  }

  ngOnInit(): void {
    this.initializeEditor();

    // Set some sample JSON to help users get started
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

    this.editor = ace.edit(this.editorElement.nativeElement);
    this.updateEditorTheme();
    this.editor.session.setMode('ace/mode/json');
    this.editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      showLineNumbers: true,
      tabSize: 2,
      fontSize: '15px',
      printMarginColumn: 120
    });

    this.editor.on('change', () => {
      this.jsonInput.setValue(this.editor.getValue());
      this.validateJson();
    });
  }

  updateEditorTheme(): void {
    if (this.editor) {
      const isDarkMode = document.body.classList.contains('dark-theme');
      this.editor.setTheme(isDarkMode ? 'ace/theme/dracula' : 'ace/theme/github');
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
      const jsonObj = JSON.parse(this.jsonInput.value || '{}');
      const beautified = JSON.stringify(jsonObj, null, 2);
      this.editor.setValue(beautified, -1);
      this.jsonOutput.setValue(beautified);
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
      const jsonObj = JSON.parse(this.jsonInput.value || '{}');
      const minified = JSON.stringify(jsonObj);
      this.jsonOutput.setValue(minified);
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
      // Basic linting: parse and re-stringify with formatting
      const jsonObj = JSON.parse(this.jsonInput.value || '{}');

      // Sort keys alphabetically for consistent output
      const sortedObj = this.sortObjectKeys(jsonObj);

      const linted = JSON.stringify(sortedObj, null, 2);
      this.editor.setValue(linted, -1);
      this.jsonOutput.setValue(linted);
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
      this.jsonOutput.setValue(this.jsonInput.value || '');
      this.updateJsonPaths();
      this.updateYamlOutput();
    } else {
      this.jsonOutput.setValue('');
      this.yamlOutput.setValue('');
      this.jsonPaths = [];
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
}
