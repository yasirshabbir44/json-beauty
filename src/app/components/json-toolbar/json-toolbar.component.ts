import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
    selector: 'app-json-toolbar',
    templateUrl: './json-toolbar.component.html',
    styleUrls: ['./json-toolbar.component.scss']
})
export class JsonToolbarComponent {
    @Input() isValidJson: boolean = false;

    // Basic actions
    @Output() lint = new EventEmitter<void>();

    // Export actions
    @Output() copy = new EventEmitter<void>();
    @Output() download = new EventEmitter<void>();
    @Output() downloadText = new EventEmitter<void>();
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

    constructor() {
    }
}
