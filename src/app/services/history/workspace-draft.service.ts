import {Injectable} from '@angular/core';

export interface WorkspaceDraft {
    jsonInput: string;
    compareJsonInput?: string;
    schemaInput?: string;
    savedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class WorkspaceDraftService {
    private readonly STORAGE_KEY = 'json_beauty_workspace_draft';
    private readonly MAX_CONTENT_BYTES = 512 * 1024;
    private readonly SAVE_DEBOUNCE_MS = 500;

    private pendingDraft: WorkspaceDraft | null = null;
    private saveTimer: ReturnType<typeof setTimeout> | null = null;

    getDraft(): WorkspaceDraft | null {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) {
                return null;
            }
            const parsed: unknown = JSON.parse(raw);
            if (!this.isValidStoredDraft(parsed)) {
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }

    hasDraft(): boolean {
        const draft = this.getDraft();
        return !!(draft?.jsonInput?.trim());
    }

    scheduleSave(draft: Omit<WorkspaceDraft, 'savedAt'>): void {
        if (!this.isStorableDraft(draft)) {
            return;
        }

        this.pendingDraft = {
            ...draft,
            savedAt: new Date().toISOString()
        };

        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        this.saveTimer = setTimeout(() => this.flush(), this.SAVE_DEBOUNCE_MS);
    }

    flush(): void {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }

        if (!this.pendingDraft) {
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.pendingDraft));
        } catch (error) {
            if (this.isQuotaExceededError(error)) {
                this.clearDraft();
            }
        }
    }

    clearDraft(): void {
        this.pendingDraft = null;
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
        }
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch {
            // ignore
        }
    }

    private isStorableDraft(draft: Omit<WorkspaceDraft, 'savedAt'>): boolean {
        const content = draft.jsonInput ?? '';
        if (!content.trim()) {
            return false;
        }

        const bytes = new Blob([content]).size;
        if (bytes > this.MAX_CONTENT_BYTES) {
            console.warn(
                `Skipping workspace draft: content size ${bytes} bytes exceeds ${this.MAX_CONTENT_BYTES} bytes limit.`
            );
            return false;
        }

        return true;
    }

    private isValidStoredDraft(value: unknown): value is WorkspaceDraft {
        if (!value || typeof value !== 'object') {
            return false;
        }

        const candidate = value as Partial<WorkspaceDraft>;
        return typeof candidate.jsonInput === 'string' && typeof candidate.savedAt === 'string';
    }

    private isQuotaExceededError(error: unknown): boolean {
        return error instanceof DOMException &&
            (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    }
}
