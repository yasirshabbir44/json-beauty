import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

export interface InputHistoryEntry {
    id: string;
    content: string;
    preview: string;
    timestamp: Date;
    sizeBytes: number;
    source?: string;
}

@Injectable({
    providedIn: 'root'
})
export class InputHistoryLogService {
    private readonly STORAGE_KEY = 'json_beauty_input_history_log';
    private readonly MAX_ENTRIES = 30;
    private readonly MAX_CONTENT_BYTES = 256 * 1024;
    private readonly PREVIEW_LENGTH = 80;

    private entriesSubject = new BehaviorSubject<InputHistoryEntry[]>([]);
    readonly entries$: Observable<InputHistoryEntry[]> = this.entriesSubject.asObservable();

    constructor() {
        this.loadFromStorage();
    }

    getEntries(): InputHistoryEntry[] {
        return this.entriesSubject.value;
    }

    addEntry(content: string, source?: string): InputHistoryEntry | null {
        const trimmed = content?.trim();
        if (!trimmed) {
            return null;
        }

        const bytes = new Blob([trimmed]).size;
        if (bytes > this.MAX_CONTENT_BYTES) {
            return null;
        }

        const entries = this.entriesSubject.value;
        const latest = entries[0];
        if (latest && latest.content === trimmed) {
            const bumped: InputHistoryEntry = {
                ...latest,
                timestamp: new Date(),
                source: source || latest.source
            };
            const updated = [bumped, ...entries.filter(e => e.id !== latest.id)];
            this.entriesSubject.next(updated.slice(0, this.MAX_ENTRIES));
            this.saveToStorage();
            return bumped;
        }

        const entry: InputHistoryEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            content: trimmed,
            preview: this.buildPreview(trimmed),
            timestamp: new Date(),
            sizeBytes: bytes,
            source
        };

        const updated = [entry, ...entries].slice(0, this.MAX_ENTRIES);
        this.entriesSubject.next(updated);
        if (!this.saveToStorage()) {
            this.entriesSubject.next(entries);
            return null;
        }
        return entry;
    }

    removeEntry(id: string): boolean {
        const entries = this.entriesSubject.value;
        const updated = entries.filter(e => e.id !== id);
        if (updated.length === entries.length) {
            return false;
        }
        this.entriesSubject.next(updated);
        this.saveToStorage();
        return true;
    }

    clearAll(): void {
        this.entriesSubject.next([]);
        this.saveToStorage();
    }

    formatSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private buildPreview(content: string): string {
        const singleLine = content.replace(/\s+/g, ' ').trim();
        if (singleLine.length <= this.PREVIEW_LENGTH) {
            return singleLine;
        }
        return `${singleLine.slice(0, this.PREVIEW_LENGTH)}…`;
    }

    private loadFromStorage(): void {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) {
                return;
            }
            const parsed: unknown = JSON.parse(raw);
            if (!Array.isArray(parsed)) {
                return;
            }
            const entries: InputHistoryEntry[] = parsed
                .filter(this.isValidStoredEntry)
                .map(e => ({
                    id: e.id,
                    content: e.content,
                    preview: typeof e.preview === 'string' ? e.preview : this.buildPreview(e.content),
                    sizeBytes: typeof e.sizeBytes === 'number' ? e.sizeBytes : new Blob([e.content]).size,
                    source: typeof e.source === 'string' ? e.source : undefined,
                    timestamp: new Date(e.timestamp)
                }))
                .filter(e => !Number.isNaN(e.timestamp.getTime()))
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, this.MAX_ENTRIES);
            this.entriesSubject.next(entries);
        } catch {
            this.entriesSubject.next([]);
        }
    }

    private saveToStorage(): boolean {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entriesSubject.value));
            return true;
        } catch (error) {
            if (this.isQuotaExceededError(error)) {
                return this.trimAndRetry();
            }
            return false;
        }
    }

    private trimAndRetry(): boolean {
        const entries = [...this.entriesSubject.value];
        while (entries.length > 1) {
            entries.pop();
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
                this.entriesSubject.next(entries);
                return true;
            } catch (error) {
                if (!this.isQuotaExceededError(error)) {
                    return false;
                }
            }
        }
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
            this.entriesSubject.next(entries);
            return true;
        } catch {
            return false;
        }
    }

    private isQuotaExceededError(error: unknown): boolean {
        return error instanceof DOMException &&
            (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    }

    private isValidStoredEntry(entry: unknown): entry is {
        id: string;
        content: string;
        timestamp: string | number | Date;
        preview?: string;
        sizeBytes?: number;
        source?: string;
    } {
        if (!entry || typeof entry !== 'object') {
            return false;
        }
        const candidate = entry as Partial<InputHistoryEntry>;
        return typeof candidate.id === 'string' &&
            typeof candidate.content === 'string' &&
            candidate.timestamp !== undefined;
    }
}
