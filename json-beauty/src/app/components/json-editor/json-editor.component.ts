import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
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
  
  constructor(private snackBar: MatSnackBar) {}

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
    this.editor.setTheme('ace/theme/github');
    this.editor.session.setMode('ace/mode/json');
    this.editor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      showLineNumbers: true,
      tabSize: 2
    });
    
    this.editor.on('change', () => {
      this.jsonInput.setValue(this.editor.getValue());
      this.validateJson();
    });
  }

  validateJson(): void {
    const jsonString = this.jsonInput.value;
    
    if (!jsonString) {
      this.isValidJson = false;
      this.errorMessage = 'JSON is empty';
      return;
    }
    
    try {
      JSON.parse(jsonString);
      this.isValidJson = true;
      this.errorMessage = '';
    } catch (e: any) {
      this.isValidJson = false;
      this.errorMessage = e.message;
    }
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
    } else {
      this.jsonOutput.setValue('');
    }
  }

  copyToClipboard(): void {
    const textToCopy = this.jsonOutput.value;
    
    if (!textToCopy) {
      this.showError('Nothing to copy');
      return;
    }
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => this.showSuccess('Copied to clipboard'))
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