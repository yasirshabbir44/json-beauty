import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/ext-searchbox';

@Component({
  selector: 'app-json-output-editor',
  templateUrl: './json-output-editor.component.html',
  styleUrls: ['./json-output-editor.component.scss']
})
export class JsonOutputEditorComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('outputEditor', { static: false }) outputEditorElement!: ElementRef;
  
  @Input() isDarkTheme: boolean = false;
  @Input() isMaximized: boolean = false;
  @Input() showOutputSearchBar: boolean = false;
  @Input() isValidJson: boolean = true;
  @Input() jsonOutput: FormControl = new FormControl('');
  @Input() yamlOutput: FormControl = new FormControl('');
  @Input() showTreeView: boolean = false;
  @Input() jsonTreeData: any = null;
  @Input() selectedOutputFormat: 'json' | 'yaml' = 'json';
  @Input() expandedNodes: Set<string> = new Set();
  @Input() treeSearchResults: string[] = [];
  @Input() showTreeSearchBar: boolean = false;
  @Input() treeSearchHighlighted: boolean = false;
  
  @Output() toggleMaximize = new EventEmitter<void>();
  @Output() toggleOutputFormat = new EventEmitter<void>();
  @Output() toggleNode = new EventEmitter<string>();
  @Output() treeSearch = new EventEmitter<string>();
  
  outputEditor: any;

  constructor() { }

  ngOnInit(): void {
    // Initialize will be done in ngAfterViewInit
  }

  ngAfterViewInit(): void {
    // Initialize output editor after view has been initialized
    setTimeout(() => {
      this.initializeOutputEditor();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('ngOnChanges triggered with changes:', Object.keys(changes).join(', '));
    
    // Update editor theme when isDarkTheme changes
    if (changes['isDarkTheme'] && this.outputEditor) {
      console.log('Updating editor theme due to isDarkTheme change');
      this.updateOutputEditorTheme();
    }

    // Handle changes to selectedOutputFormat
    if (changes['selectedOutputFormat']) {
      console.log('Output format changed to:', this.selectedOutputFormat);
      
      // If switching to JSON format, ensure the editor is initialized and visible
      if (this.selectedOutputFormat === 'json' && !this.showTreeView) {
        console.log('Switching to JSON format, ensuring editor is initialized');
        
        // If editor isn't initialized yet, initialize it
        if (!this.outputEditor) {
          console.log('Editor not initialized, initializing now');
          setTimeout(() => this.initializeOutputEditor(), 0);
        } else {
          // If already initialized, ensure it's properly sized and updated
          console.log('Editor already initialized, updating and resizing');
          setTimeout(() => {
            if (this.outputEditor) {
              this.outputEditor.setValue(this.jsonOutput.value || '', -1);
              this.outputEditor.renderer.updateFull(true);
              this.outputEditor.resize();
            }
          }, 100);
        }
      }
    }

    // Update editor content when jsonOutput changes
    if (changes['jsonOutput'] && this.outputEditor && !this.showTreeView && this.selectedOutputFormat === 'json') {
      console.log('Updating editor content due to jsonOutput change');
      try {
        this.outputEditor.setValue(this.jsonOutput.value || '', -1);
        this.outputEditor.renderer.updateFull(true);
        
        // Ensure editor is properly sized after content update
        setTimeout(() => {
          if (this.outputEditor) {
            console.log('Resizing editor after content update');
            this.outputEditor.resize();
          }
        }, 100);
      } catch (error) {
        console.error('Error updating editor content:', error);
      }
    }
    
    // Handle changes to showTreeView
    if (changes['showTreeView']) {
      console.log('showTreeView changed to:', this.showTreeView);
      
      // If switching from tree view to JSON view, ensure editor is initialized and visible
      if (!this.showTreeView && this.selectedOutputFormat === 'json') {
        console.log('Switching from tree view to JSON view');
        
        // Short delay to allow DOM to update before initializing/updating editor
        setTimeout(() => {
          if (!this.outputEditor) {
            console.log('Editor not initialized, initializing now');
            this.initializeOutputEditor();
          } else {
            console.log('Editor already initialized, updating and resizing');
            this.outputEditor.setValue(this.jsonOutput.value || '', -1);
            this.outputEditor.renderer.updateFull(true);
            this.outputEditor.resize();
          }
        }, 100);
      }
    }
  }

  /**
   * Initializes the output editor separately
   */
  initializeOutputEditor(): void {
    console.log('Initializing output editor...');
    
    // Check if the output editor element is available
    if (!this.outputEditorElement || !this.outputEditorElement.nativeElement) {
      console.warn('Output editor element not available, will retry if in JSON mode');
      // If not available and we're in JSON mode without tree view, try again after a delay
      if (!this.showTreeView && this.selectedOutputFormat === 'json') {
        setTimeout(() => {
          console.log('Retrying output editor initialization...');
          this.initializeOutputEditor();
        }, 100);
      }
      return;
    }

    // If the output editor is already initialized, don't initialize it again
    if (this.outputEditor) {
      console.log('Output editor already initialized');
      return;
    }
    
    try {
      // Set the basePath for ace editor to load its modes, themes, and extensions
      console.log('Setting ace editor basePath...');
      ace.config.set('basePath', 'https://unpkg.com/ace-builds@1.32.0/src-noconflict/');
      
      // Initialize the output editor
      console.log('Creating ace editor instance...');
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

      // Force initial render
      console.log('Forcing initial render...');
      this.outputEditor.renderer.updateFull(true);

      // Update the output if we have valid JSON
      if (this.isValidJson && this.jsonOutput.value) {
        console.log('Setting initial JSON value:', this.jsonOutput.value.substring(0, 50) + '...');
        this.outputEditor.setValue(this.jsonOutput.value, -1);
        
        // Ensure editor is visible and properly sized
        setTimeout(() => {
          if (this.outputEditor) {
            console.log('Resizing editor after initialization...');
            this.outputEditor.resize();
          }
        }, 100);
      } else {
        console.warn('No valid JSON to display in output editor');
      }
      
      console.log('Output editor initialization complete');
    } catch (error) {
      console.error('Error initializing output editor:', error);
    }
  }

  updateOutputEditorTheme(): void {
    if (this.outputEditor) {
      this.outputEditor.setTheme(this.isDarkTheme ? 'ace/theme/dracula' : 'ace/theme/github');
    }
  }

  /**
   * Toggles the maximized state of the output section
   */
  toggleOutputMaximize(): void {
    this.toggleMaximize.emit();
    
    // Resize the editor after the UI has updated
    setTimeout(() => {
      if (this.outputEditor) {
        this.outputEditor.resize();
      }
    }, 100);
  }

  /**
   * Toggles the output format between JSON and YAML
   */
  onToggleOutputFormat(): void {
    this.toggleOutputFormat.emit();
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
}