import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-json-toolbar',
  templateUrl: './json-toolbar.component.html',
  styleUrls: ['./json-toolbar.component.scss']
})
export class JsonToolbarComponent {
  @Input() isValidJson: boolean = false;

  // Basic actions
  @Output() beautify = new EventEmitter<void>();
  @Output() minify = new EventEmitter<void>();
  @Output() lint = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() import = new EventEmitter<Event>();

  // Export actions
  @Output() copy = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  @Output() share = new EventEmitter<void>();
  @Output() convertToCsv = new EventEmitter<void>();
  @Output() convertToXml = new EventEmitter<void>();

  // Feature toggles
  @Output() toggleTreeView = new EventEmitter<void>();
  @Output() toggleOutputFormat = new EventEmitter<void>();
  @Output() toggleJsonPaths = new EventEmitter<void>();
  @Output() toggleSchemaEditor = new EventEmitter<void>();
  
  // Advanced features
  @Output() generateSchema = new EventEmitter<void>();
  @Output() toggleJsonPathQuery = new EventEmitter<void>();
  @Output() toggleJsonCompare = new EventEmitter<void>();
  @Output() toggleJsonVisualize = new EventEmitter<void>();

  // Settings
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() toggleFormattingOptions = new EventEmitter<void>();
  @Output() toggleKeyboardShortcuts = new EventEmitter<void>();
  @Output() toggleSearchReplace = new EventEmitter<void>();

  constructor() {}

  onImportClick(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  onFileSelected(event: Event): void {
    this.import.emit(event);
  }
}
