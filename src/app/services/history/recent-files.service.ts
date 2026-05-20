import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

export interface RecentFile {
    id: string;
    name: string;
    content: string;
    timestamp: Date;
    sizeBytes: number;
}

@Injectable({
    providedIn: 'root'
})
export class RecentFilesService {
    private readonly STORAGE_KEY = 'json_beauty_recent_files';
    private readonly MAX_RECENT = 10;
    private readonly MAX_CONTENT_BYTES = 256 * 1024;

    private recentSubject = new BehaviorSubject<RecentFile[]>([]);
    readonly recentFiles$: Observable<RecentFile[]> = this.recentSubject.asObservable();

    constructor() {
        this.loadFromStorage();
    }

    getRecentFiles(): RecentFile[] {
        return this.recentSubject.value;
    }

    addRecent(name: string, content: string): RecentFile | null {
        const trimmed = content?.trim();
        if (!trimmed) {
            return null;
        }

        const bytes = new Blob([trimmed]).size;
        if (bytes > this.MAX_CONTENT_BYTES) {
            return null;
        }

        const displayName = name?.trim() || 'Untitled JSON';
        const versions = this.recentSubject.value;
        const existing = versions.find(v => v.name === displayName && v.content === trimmed);
        if (existing) {
            const bumped: RecentFile = {...existing, timestamp: new Date()};
            const updated = [bumped, ...versions.filter(v => v.id !== existing.id)];
            this.recentSubject.next(updated.slice(0, this.MAX_RECENT));
            this.saveToStorage();
            return bumped;
        }

        const entry: RecentFile = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            name: displayName,
            content: trimmed,
            timestamp: new Date(),
            sizeBytes: bytes
        };

        const updated = [entry, ...versions].slice(0, this.MAX_RECENT);
        this.recentSubject.next(updated);
        if (!this.saveToStorage()) {
            this.recentSubject.next(versions);
            return null;
        }
        return entry;
    }

    removeRecent(id: string): boolean {
        const versions = this.recentSubject.value;
        const updated = versions.filter(v => v.id !== id);
        if (updated.length === versions.length) {
            return false;
        }
        this.recentSubject.next(updated);
        this.saveToStorage();
        return true;
    }

    clearAll(): void {
        this.recentSubject.next([]);
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
            const files: RecentFile[] = parsed
                .filter(this.isValidStoredEntry)
                .map(v => ({
                    id: v.id,
                    name: v.name,
                    content: v.content,
                    sizeBytes: typeof v.sizeBytes === 'number' ? v.sizeBytes : new Blob([v.content]).size,
                    timestamp: new Date(v.timestamp)
                }))
                .filter(v => !Number.isNaN(v.timestamp.getTime()))
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, this.MAX_RECENT);
            this.recentSubject.next(files);
        } catch {
            this.recentSubject.next([]);
        }
    }

    private saveToStorage(): boolean {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.recentSubject.value));
            return true;
        } catch (error) {
            if (this.isQuotaExceededError(error)) {
                return this.trimAndRetry();
            }
            return false;
        }
    }

    private trimAndRetry(): boolean {
        const files = [...this.recentSubject.value];
        while (files.length > 1) {
            files.pop();
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
                this.recentSubject.next(files);
                return true;
            } catch (error) {
                if (!this.isQuotaExceededError(error)) {
                    return false;
                }
            }
        }
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
            this.recentSubject.next(files);
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
        name: string;
        content: string;
        timestamp: string | number | Date;
        sizeBytes?: number;
    } {
        if (!entry || typeof entry !== 'object') {
            return false;
        }
        const c = entry as Partial<RecentFile>;
        return typeof c.id === 'string' && typeof c.name === 'string' && typeof c.content === 'string' &&
            c.timestamp !== undefined;
    }
}
