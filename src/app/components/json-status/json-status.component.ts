import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-json-status',
    templateUrl: './json-status.component.html',
    styleUrls: ['./json-status.component.scss']
})
export class JsonStatusComponent {
    @Input() isValidJson: boolean = true;
    /** Human-readable size (for example 2.1 KB). */
    @Input() displaySize: string = '0 B';
    @Input() selectedOutputFormat: 'json' | 'yaml' = 'json';
    @Input() selectedViewMode: 'text' | 'tree' | 'table' = 'text';
    /** 1-based line in the input editor. */
    @Input() cursorLine: number = 1;
    /** 1-based column in the input editor. */
    @Input() cursorColumn: number = 1;
    @Input() errorMessage: string = '';

    get viewModeLabel(): string {
        if (this.selectedOutputFormat === 'yaml') {
            return 'YAML output';
        }
        switch (this.selectedViewMode) {
            case 'tree':
                return 'Tree view';
            case 'table':
                return 'Table view';
            default:
                return 'JSON text';
        }
    }

    get viewModeIcon(): string {
        if (this.selectedOutputFormat === 'yaml') {
            return 'description';
        }
        switch (this.selectedViewMode) {
            case 'tree':
                return 'account_tree';
            case 'table':
                return 'table_chart';
            default:
                return 'article';
        }
    }
}
