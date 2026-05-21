import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {FormControl} from '@angular/forms';
import {DEFAULT_FORMATTING_OPTIONS, FormattingOptions} from '../../models/json-editor.models';
import {JsonFormattingService} from '../../services/formatting/json-formatting.service';

@Component({
    selector: 'app-json-dialogs',
    templateUrl: './json-dialogs.component.html',
    styleUrls: ['./json-dialogs.component.scss'],
    standalone: false
})
export class JsonDialogsComponent implements OnChanges {
    readonly indentSizeChoices = [2, 4, 8] as const;
    readonly defaultOptions = DEFAULT_FORMATTING_OPTIONS;

    @Input() showKeyboardShortcuts: boolean = false;
    @Input() keyboardShortcuts: { key: string, action: string }[] = [];
    @Output() toggleKeyboardShortcuts = new EventEmitter<void>();

    @Input() showFormattingOptions: boolean = false;
    @Input() formattingOptions: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS };
    @Input() formatPreviewSource = '';
    @Output() toggleFormattingOptions = new EventEmitter<void>();
    @Output() applyFormatting = new EventEmitter<FormattingOptions>();

    draft: FormattingOptions = { ...DEFAULT_FORMATTING_OPTIONS };
    previewText = '';
    previewUsesSample = true;

    @Input() showSchemaEditor: boolean = false;
    @Input() schemaInput: FormControl = new FormControl('');
    @Input() schemaValidationResult: { isValid: boolean, errors: any[] } | null = null;
    @Output() toggleSchemaEditor = new EventEmitter<void>();
    @Output() validateJsonSchema = new EventEmitter<void>();

    @Input() showJsonPathQueryDialog: boolean = false;
    @Input() jsonPathQuery: FormControl = new FormControl('');
    @Input() jsonPathQueryResult: string = '';
    @Output() toggleJsonPathQuery = new EventEmitter<void>();
    @Output() executeJsonPathQuery = new EventEmitter<void>();

    @Input() showJsonCompare: boolean = false;
    @Input() currentJson: string = '';
    @Input() compareJsonInput: FormControl = new FormControl('');
    @Input() jsonDiffResult: { delta: any, htmlDiff: string, hasChanges: boolean } | null = null;
    @Input() compareError: string | null = null;
    @Input() isCompareInputValid = true;
    @Output() toggleJsonCompare = new EventEmitter<void>();
    @Output() compareJson = new EventEmitter<void>();
    @Output() useLatestVersionForCompare = new EventEmitter<void>();
    @Output() swapCompareSides = new EventEmitter<void>();
    @Output() formatCompareInput = new EventEmitter<void>();

    @Input() showJsonVisualize: boolean = false;
    @Input() jsonData: any = null;
    @Output() toggleJsonVisualize = new EventEmitter<void>();

    constructor(private formattingService: JsonFormattingService) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['showFormattingOptions']?.currentValue === true || changes['formattingOptions']) {
            this.syncDraftFromInput();
        }
        if (
            changes['showFormattingOptions'] ||
            changes['formattingOptions'] ||
            changes['formatPreviewSource']
        ) {
            this.refreshPreview();
        }
    }

    get indentLabel(): string {
        const unit = this.draft.indentChar === '\t' ? 'tab' : 'space';
        const plural = this.draft.indentSize === 1 ? '' : 's';
        return `${this.draft.indentSize} ${unit}${plural}`;
    }

    closeKeyboardShortcuts(): void {
        this.toggleKeyboardShortcuts.emit();
    }

    closeFormattingOptions(): void {
        this.toggleFormattingOptions.emit();
    }

    onDraftChanged(): void {
        this.refreshPreview();
    }

    setIndentSize(size: number | null): void {
        if (size == null) {
            return;
        }
        this.draft = { ...this.draft, indentSize: size };
        this.onDraftChanged();
    }

    setIndentChar(char: ' ' | '\t' | null): void {
        if (char == null) {
            return;
        }
        this.draft = { ...this.draft, indentChar: char };
        this.onDraftChanged();
    }

    resetToDefaults(): void {
        this.draft = { ...DEFAULT_FORMATTING_OPTIONS };
        this.onDraftChanged();
    }

    onApplyFormatting(): void {
        this.applyFormatting.emit({ ...this.draft });
    }

    closeSchemaEditor(): void {
        this.toggleSchemaEditor.emit();
    }

    onValidateJsonSchema(): void {
        this.validateJsonSchema.emit();
    }

    closeJsonPathQuery(): void {
        this.toggleJsonPathQuery.emit();
    }

    onExecuteJsonPathQuery(): void {
        this.executeJsonPathQuery.emit();
    }

    closeJsonCompare(): void {
        this.toggleJsonCompare.emit();
    }

    onCompareJson(): void {
        this.compareJson.emit();
    }

    onUseLatestVersionForCompare(): void {
        this.useLatestVersionForCompare.emit();
    }

    onSwapCompareSides(): void {
        this.swapCompareSides.emit();
    }

    onFormatCompareInput(): void {
        this.formatCompareInput.emit();
    }

    closeJsonVisualize(): void {
        this.toggleJsonVisualize.emit();
    }

    private syncDraftFromInput(): void {
        this.draft = { ...this.formattingOptions };
    }

    private refreshPreview(): void {
        const source = (this.formatPreviewSource || '').trim();
        this.previewUsesSample = source.length === 0;
        this.previewText = this.formattingService.buildPreview(source, this.draft);
    }
}
