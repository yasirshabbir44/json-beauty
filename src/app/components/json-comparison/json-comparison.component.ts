import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { JsonService } from '../../services/json.service';

@Component({
  selector: 'app-json-comparison',
  templateUrl: './json-comparison.component.html',
  styleUrls: ['./json-comparison.component.scss']
})
export class JsonComparisonComponent implements OnInit {
  @Input() jsonData: any;
  @Input() compareJsonInput: FormControl = new FormControl('');
  @Input() jsonDiffResult: { delta: any, htmlDiff: string, hasChanges: boolean } | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() compareComplete = new EventEmitter<{ delta: any, htmlDiff: string, hasChanges: boolean }>();
  @Output() useLatestVersionRequested = new EventEmitter<void>();
  
  constructor(private jsonService: JsonService) { }

  ngOnInit(): void {
    // Initialize with empty form control if not provided
    if (!this.compareJsonInput) {
      this.compareJsonInput = new FormControl('');
    }
  }

  /**
   * Compares the JSON documents
   */
  compareJson(): void {
    try {
      if (!this.jsonData) {
        throw new Error('No JSON data to compare');
      }

      // Get the JSON data to compare against
      const compareData = this.compareJsonInput.value;
      if (!compareData) {
        throw new Error('Please enter JSON to compare');
      }

      // Compare the JSON documents
      const result = this.jsonService.compareJson(
        typeof this.jsonData === 'string' ? this.jsonData : JSON.stringify(this.jsonData),
        compareData
      );

      // Emit the result
      this.compareComplete.emit(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error comparing JSON: ${errorMessage}`);
      
      // Emit undefined on error instead of null to match the expected type
      this.compareComplete.emit(undefined);
    }
  }

  /**
   * Closes the comparison dialog
   */
  closeDialog(): void {
    this.close.emit();
  }

  /**
   * Requests parent to prefill compare input from latest saved version.
   */
  requestLatestVersion(): void {
    this.useLatestVersionRequested.emit();
  }

  /**
   * Clears the compare input area.
   */
  clearCompareInput(): void {
    this.compareJsonInput.setValue('');
  }

  /**
   * Returns a compact preview string for the current JSON.
   */
  getCurrentJsonPreview(): string {
    if (!this.jsonData) {
      return '{}';
    }

    const raw =
      typeof this.jsonData === 'string'
        ? this.jsonData
        : JSON.stringify(this.jsonData, null, 2);

    const maxPreviewChars = 1200;
    if (raw.length <= maxPreviewChars) {
      return raw;
    }

    return `${raw.slice(0, maxPreviewChars)}\n...`;
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

  getReadableChanges(limit: number = 8): Array<{ path: string; kind: 'added' | 'removed' | 'changed' }> {
    if (!this.jsonDiffResult?.delta) {
      return [];
    }

    const changes: Array<{ path: string; kind: 'added' | 'removed' | 'changed' }> = [];
    this.collectReadableChanges(this.jsonDiffResult.delta, '$', changes, limit);
    return changes;
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