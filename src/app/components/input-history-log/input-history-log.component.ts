import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    InputHistoryEntry,
    InputHistoryLogService
} from '../../services/history/input-history-log.service';
import {MICRO_INTERACTION_ANIMATIONS} from '../../animations/micro-interactions.animations';

@Component({
    selector: 'app-input-history-log',
    templateUrl: './input-history-log.component.html',
    styleUrls: ['./input-history-log.component.scss'],
    animations: MICRO_INTERACTION_ANIMATIONS,
    standalone: false
})
export class InputHistoryLogComponent implements OnInit, OnDestroy {
    @Output() entrySelected = new EventEmitter<string>();

    entries: InputHistoryEntry[] = [];
    isOpen = false;

    private subscription: Subscription | null = null;

    constructor(
        private inputHistoryLogService: InputHistoryLogService,
        private snackBar: MatSnackBar
    ) {
    }

    ngOnInit(): void {
        this.subscription = this.inputHistoryLogService.entries$.subscribe(entries => {
            this.entries = entries;
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    togglePanel(): void {
        this.isOpen = !this.isOpen;
    }

    formatDate(date: Date | string): string {
        const resolvedDate = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(resolvedDate.getTime())) {
            return 'Unknown date';
        }
        return resolvedDate.toLocaleString();
    }

    formatSize(bytes: number): string {
        return this.inputHistoryLogService.formatSize(bytes);
    }

    loadEntry(entry: InputHistoryEntry): void {
        this.entrySelected.emit(entry.content);
        this.showSuccess(`Loaded input from ${this.formatDate(entry.timestamp)}`);
    }

    removeEntry(entryId: string, event: MouseEvent): void {
        event.stopPropagation();
        if (this.inputHistoryLogService.removeEntry(entryId)) {
            this.showSuccess('Entry removed');
        } else {
            this.showError('Failed to remove entry');
        }
    }

    clearHistory(): void {
        if (confirm('Clear all history log entries? This cannot be undone.')) {
            this.inputHistoryLogService.clearAll();
            this.showSuccess('History log cleared');
        }
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 3000,
            panelClass: 'success-snackbar'
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 5000,
            panelClass: 'error-snackbar'
        });
    }
}
