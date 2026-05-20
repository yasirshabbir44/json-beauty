import { Component, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { InputSanitizationService } from '../../services/security/input-sanitization.service';

export interface JsonDiffViewResult {
  delta: any;
  htmlDiff: string;
  hasChanges: boolean;
}

@Component({
  selector: 'app-json-comparison',
  templateUrl: './json-comparison.component.html',
  styleUrls: ['./json-comparison.component.scss'],
  standalone: false
})
export class JsonComparisonComponent {
  @Input() currentJson = '';
  @Input() compareJsonInput: FormControl = new FormControl('');
  @Input() jsonDiffResult: JsonDiffViewResult | null = null;
  @Input() compareError: string | null = null;
  @Input() isCompareInputValid = true;

  @Output() close = new EventEmitter<void>();
  @Output() compareRequested = new EventEmitter<void>();
  @Output() useLatestVersionRequested = new EventEmitter<void>();
  @Output() swapSidesRequested = new EventEmitter<void>();
  @Output() formatCompareInputRequested = new EventEmitter<void>();

  constructor(private sanitizationService: InputSanitizationService) {}

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeDialog();
      return;
    }

    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key === 'Enter') {
      event.preventDefault();
      this.requestCompare();
    }
  }

  get sanitizedDiffHtml(): SafeHtml | null {
    if (!this.jsonDiffResult?.htmlDiff) {
      return null;
    }
    return this.sanitizationService.sanitizeHtml(this.jsonDiffResult.htmlDiff);
  }

  get hasCompareInput(): boolean {
    return !!(this.compareJsonInput.value || '').trim();
  }

  requestCompare(): void {
    this.compareRequested.emit();
  }

  closeDialog(): void {
    this.close.emit();
  }

  requestLatestVersion(): void {
    this.useLatestVersionRequested.emit();
  }

  requestSwapSides(): void {
    this.swapSidesRequested.emit();
  }

  requestFormatCompareInput(): void {
    this.formatCompareInputRequested.emit();
  }

  clearCompareInput(): void {
    this.compareJsonInput.setValue('');
  }

  getCurrentJsonPreview(): string {
    const raw = (this.currentJson || '').trim();
    if (!raw) {
      return '{}';
    }

    const maxPreviewChars = 2400;
    if (raw.length <= maxPreviewChars) {
      return raw;
    }

    return `${raw.slice(0, maxPreviewChars)}\n… (${raw.length - maxPreviewChars} more characters in editor)`;
  }

  getDiffSummary(): { added: number; removed: number; changed: number; total: number } {
    const counts = { added: 0, removed: 0, changed: 0, total: 0 };
    if (!this.jsonDiffResult?.delta) {
      return counts;
    }

    this.collectDiffStats(this.jsonDiffResult.delta, '$', counts);
    counts.total = counts.added + counts.removed + counts.changed;
    return counts;
  }

  getReadableChanges(limit: number = 12): Array<{ path: string; kind: 'added' | 'removed' | 'changed' }> {
    if (!this.jsonDiffResult?.delta) {
      return [];
    }

    const changes: Array<{ path: string; kind: 'added' | 'removed' | 'changed' }> = [];
    this.collectReadableChanges(this.jsonDiffResult.delta, '$', changes, limit);
    return changes;
  }

  trackChangeItem(_index: number, item: { path: string; kind: string }): string {
    return `${item.kind}:${item.path}`;
  }

  private collectDiffStats(
    deltaNode: any,
    currentPath: string,
    counts: { added: number; removed: number; changed: number }
  ): void {
    if (!deltaNode || typeof deltaNode !== 'object') {
      return;
    }

    if (Array.isArray(deltaNode)) {
      const kind = this.getLeafKind(deltaNode);
      if (kind === 'added') {
        counts.added += 1;
      } else if (kind === 'removed') {
        counts.removed += 1;
      } else if (kind === 'changed') {
        counts.changed += 1;
      }
      return;
    }

    const isArrayDelta = deltaNode._t === 'a';
    Object.keys(deltaNode).forEach(key => {
      if (key === '_t') {
        return;
      }

      const child = deltaNode[key];
      const nextPath = isArrayDelta
        ? this.buildArrayPath(currentPath, key)
        : this.buildObjectPath(currentPath, key);

      this.collectDiffStats(child, nextPath, counts);
    });
  }

  private collectReadableChanges(
    deltaNode: any,
    currentPath: string,
    out: Array<{ path: string; kind: 'added' | 'removed' | 'changed' }>,
    limit: number
  ): void {
    if (!deltaNode || typeof deltaNode !== 'object' || out.length >= limit) {
      return;
    }

    if (Array.isArray(deltaNode)) {
      const kind = this.getLeafKind(deltaNode);
      if (kind) {
        out.push({ path: currentPath, kind });
      }
      return;
    }

    const isArrayDelta = deltaNode._t === 'a';
    for (const key of Object.keys(deltaNode)) {
      if (key === '_t' || out.length >= limit) {
        continue;
      }

      const child = deltaNode[key];
      const nextPath = isArrayDelta
        ? this.buildArrayPath(currentPath, key)
        : this.buildObjectPath(currentPath, key);

      this.collectReadableChanges(child, nextPath, out, limit);
    }
  }

  private getLeafKind(leaf: any[]): 'added' | 'removed' | 'changed' | null {
    if (leaf.length === 1) {
      return 'added';
    }
    if (leaf.length >= 3 && leaf[1] === 0 && leaf[2] === 0) {
      return 'removed';
    }
    if (leaf.length >= 2) {
      return 'changed';
    }
    return null;
  }

  private buildObjectPath(base: string, key: string): string {
    return base === '$' ? `${base}.${key}` : `${base}.${key}`;
  }

  private buildArrayPath(base: string, key: string): string {
    const normalized = key.startsWith('_') ? key.substring(1) : key;
    return `${base}[${normalized}]`;
  }
}
