import {Component, Input} from '@angular/core';

@Component({
    selector: 'app-json-status',
    templateUrl: './json-status.component.html',
    styleUrls: ['./json-status.component.scss']
})
export class JsonStatusComponent {
    @Input() isValidJson: boolean = true;
    @Input() jsonSize: string = '0';
    @Input() selectedOutputFormat: 'json' | 'yaml' = 'json';
    @Input() selectedViewMode: 'text' | 'tree' | 'table' = 'text';

    constructor() {
    }

    /** Label for the status bar when viewing structured JSON. */
    get viewModeLabel(): string {
        switch (this.selectedViewMode) {
            case 'tree':
                return 'Tree view';
            case 'table':
                return 'Table view';
            default:
                return 'Text view';
        }
    }
}