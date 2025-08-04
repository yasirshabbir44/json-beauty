import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-json-dialogs',
  templateUrl: './json-dialogs.component.html',
  styleUrls: ['./json-dialogs.component.scss']
})
export class JsonDialogsComponent {
  // Keyboard shortcuts dialog
  @Input() showKeyboardShortcuts: boolean = false;
  @Input() keyboardShortcuts: { key: string, action: string }[] = [];
  @Output() toggleKeyboardShortcuts = new EventEmitter<void>();
  
  // Formatting options dialog
  @Input() showFormattingOptions: boolean = false;
  @Input() indentSize: number = 2;
  @Input() indentChar: string = ' ';
  @Output() toggleFormattingOptions = new EventEmitter<void>();
  @Output() applyFormatting = new EventEmitter<{ indentSize: number, indentChar: string }>();
  
  // Schema validation dialog
  @Input() showSchemaEditor: boolean = false;
  @Input() schemaInput: FormControl = new FormControl('');
  @Input() schemaValidationResult: { isValid: boolean, errors: any[] } | null = null;
  @Output() toggleSchemaEditor = new EventEmitter<void>();
  @Output() validateJsonSchema = new EventEmitter<void>();
  
  // JSON path query dialog
  @Input() showJsonPathQueryDialog: boolean = false;
  @Input() jsonPathQuery: FormControl = new FormControl('');
  @Input() jsonPathQueryResult: string = '';
  @Output() toggleJsonPathQuery = new EventEmitter<void>();
  @Output() executeJsonPathQuery = new EventEmitter<void>();
  
  // JSON comparison dialog
  @Input() showJsonCompare: boolean = false;
  @Input() compareJsonInput: FormControl = new FormControl('');
  @Input() jsonDiffResult: { delta: any, htmlDiff: string, hasChanges: boolean } | null = null;
  @Output() toggleJsonCompare = new EventEmitter<void>();
  @Output() compareJson = new EventEmitter<void>();
  
  // JSON visualization dialog
  @Input() showJsonVisualize: boolean = false;
  @Output() toggleJsonVisualize = new EventEmitter<void>();
  
  constructor() { }
  
  /**
   * Closes the keyboard shortcuts dialog
   */
  closeKeyboardShortcuts(): void {
    this.toggleKeyboardShortcuts.emit();
  }
  
  /**
   * Closes the formatting options dialog
   */
  closeFormattingOptions(): void {
    this.toggleFormattingOptions.emit();
  }
  
  /**
   * Applies the formatting options
   */
  onApplyFormatting(): void {
    this.applyFormatting.emit({
      indentSize: this.indentSize,
      indentChar: this.indentChar
    });
  }
  
  /**
   * Closes the schema editor dialog
   */
  closeSchemaEditor(): void {
    this.toggleSchemaEditor.emit();
  }
  
  /**
   * Validates the JSON against the schema
   */
  onValidateJsonSchema(): void {
    this.validateJsonSchema.emit();
  }
  
  /**
   * Closes the JSON path query dialog
   */
  closeJsonPathQuery(): void {
    this.toggleJsonPathQuery.emit();
  }
  
  /**
   * Executes the JSON path query
   */
  onExecuteJsonPathQuery(): void {
    this.executeJsonPathQuery.emit();
  }
  
  /**
   * Closes the JSON comparison dialog
   */
  closeJsonCompare(): void {
    this.toggleJsonCompare.emit();
  }
  
  /**
   * Compares the JSON documents
   */
  onCompareJson(): void {
    this.compareJson.emit();
  }
  
  /**
   * Closes the JSON visualization dialog
   */
  closeJsonVisualize(): void {
    this.toggleJsonVisualize.emit();
  }
}