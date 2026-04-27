import {
    AfterViewInit,
    Component,
    DestroyRef,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup} from '@angular/forms';
import {debounceTime, merge, startWith, Subject} from 'rxjs';
import {SearchReplaceService} from '../../services/search/search-replace.service';

export interface SearchReplaceActiveMatch {
    start: number;
    length: number;
}

@Component({
    selector: 'app-json-search-replace',
    templateUrl: './json-search-replace.component.html',
    styleUrls: ['./json-search-replace.component.scss']
})
export class JsonSearchReplaceComponent implements AfterViewInit, OnChanges {
    @Input() text: string = '';
    @Output() textChanged = new EventEmitter<string>();
    @Output() activeMatchChange = new EventEmitter<SearchReplaceActiveMatch | null>();

    @ViewChild('searchPatternInput') searchPatternInput?: ElementRef<HTMLInputElement>;

    searchForm: FormGroup;
    searchResults: { index: number; length: number; match: string }[] = [];
    currentResultIndex: number = -1;
    totalReplacements: number = 0;
    regexError: string | null = null;

    private readonly textRefresh$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private searchReplaceService: SearchReplaceService,
        private destroyRef: DestroyRef
    ) {
        this.searchForm = this.fb.group({
            searchPattern: [''],
            replacePattern: [''],
            isRegex: [false],
            isCaseSensitive: [false],
            isWholeWord: [false]
        });

        merge(
            this.searchForm.get('searchPattern')!.valueChanges.pipe(
                debounceTime(200),
                startWith(this.searchForm.get('searchPattern')!.value)
            ),
            this.searchForm.get('isRegex')!.valueChanges,
            this.searchForm.get('isCaseSensitive')!.valueChanges,
            this.searchForm.get('isWholeWord')!.valueChanges
        )
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.runSearch());

        this.textRefresh$
            .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.runSearch());
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['text']) {
            this.textRefresh$.next();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.searchPatternInput?.nativeElement.focus(), 0);
    }

    onSearchFieldKeydown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
                this.findPrevious();
            } else {
                this.findNext();
            }
        }
    }

    onReplaceFieldKeydown(event: KeyboardEvent): void {
        const mod = event.ctrlKey || event.metaKey;
        if (event.key === 'Enter' && mod) {
            event.preventDefault();
            this.replace();
        }
    }

    /**
     * Runs search (also used by the refresh control).
     */
    search(): void {
        this.runSearch();
    }

    private runSearch(): void {
        this.regexError = null;
        const {searchPattern, isRegex, isCaseSensitive, isWholeWord} = this.searchForm.value;

        if (!searchPattern || !this.text) {
            this.searchResults = [];
            this.currentResultIndex = -1;
            this.emitActiveMatch(null);
            return;
        }

        let pattern = searchPattern;

        if (isWholeWord && !isRegex) {
            pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
        }

        const useRegex = isRegex || isWholeWord;

        if (useRegex) {
            try {
                const flags = isCaseSensitive ? 'g' : 'gi';
                new RegExp(pattern, flags);
            } catch {
                this.regexError = 'Invalid regular expression';
                this.searchResults = [];
                this.currentResultIndex = -1;
                this.emitActiveMatch(null);
                return;
            }
        }

        this.searchResults = this.searchReplaceService.search(
            this.text,
            pattern,
            useRegex,
            isCaseSensitive
        );

        this.currentResultIndex = this.searchResults.length > 0 ? 0 : -1;
        this.emitActiveMatchFromCurrent();
    }

    findNext(): void {
        if (this.searchResults.length === 0) {
            this.runSearch();
            return;
        }

        if (this.currentResultIndex < this.searchResults.length - 1) {
            this.currentResultIndex++;
        } else {
            this.currentResultIndex = 0;
        }

        this.emitActiveMatchFromCurrent();
    }

    findPrevious(): void {
        if (this.searchResults.length === 0) {
            this.runSearch();
            return;
        }

        if (this.currentResultIndex > 0) {
            this.currentResultIndex--;
        } else {
            this.currentResultIndex = this.searchResults.length - 1;
        }

        this.emitActiveMatchFromCurrent();
    }

    replace(): void {
        if (this.searchResults.length === 0 || this.currentResultIndex === -1) {
            this.runSearch();
            return;
        }

        const {searchPattern, replacePattern, isRegex, isCaseSensitive, isWholeWord} = this.searchForm.value;

        if (!searchPattern) {
            return;
        }

        let pattern = searchPattern;

        if (isWholeWord && !isRegex) {
            pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
        }

        const currentResult = this.searchResults[this.currentResultIndex];
        const replacedAt = currentResult.index;

        const before = this.text.substring(0, currentResult.index);
        const after = this.text.substring(currentResult.index + currentResult.length);

        this.text = before + replacePattern + after;
        this.textChanged.emit(this.text);

        this.runSearch();

        const nextFrom = replacedAt + replacePattern.length;
        const idx = this.searchResults.findIndex(r => r.index >= nextFrom);
        if (this.searchResults.length === 0) {
            this.currentResultIndex = -1;
            this.emitActiveMatch(null);
        } else if (idx >= 0) {
            this.currentResultIndex = idx;
            this.emitActiveMatchFromCurrent();
        } else {
            this.currentResultIndex = 0;
            this.emitActiveMatchFromCurrent();
        }

        this.totalReplacements++;
    }

    replaceAll(): void {
        const {searchPattern, replacePattern, isRegex, isCaseSensitive, isWholeWord} = this.searchForm.value;

        if (!searchPattern || !this.text) {
            return;
        }

        let pattern = searchPattern;

        if (isWholeWord && !isRegex) {
            pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
        }

        const beforeCount = this.searchResults.length;

        const newText = this.searchReplaceService.replaceAll(
            this.text,
            pattern,
            replacePattern,
            isRegex || isWholeWord,
            isCaseSensitive
        );

        this.text = newText;
        this.textChanged.emit(this.text);

        this.runSearch();

        this.totalReplacements += beforeCount;
    }

    private emitActiveMatchFromCurrent(): void {
        if (this.currentResultIndex >= 0 && this.currentResultIndex < this.searchResults.length) {
            const result = this.searchResults[this.currentResultIndex];
            this.emitActiveMatch({start: result.index, length: result.length});
        } else {
            this.emitActiveMatch(null);
        }
    }

    private emitActiveMatch(match: SearchReplaceActiveMatch | null): void {
        this.activeMatchChange.emit(match);
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
