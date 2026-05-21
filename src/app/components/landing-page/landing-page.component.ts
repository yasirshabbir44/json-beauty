import {Component} from '@angular/core';
import {RouterLink} from '@angular/router';
import {KEYBOARD_SHORTCUTS} from '../../data/keyboard-shortcuts.data';

interface FeatureCard {
    icon: string;
    title: string;
    description: string;
}

interface ScreenshotPanel {
    id: string;
    label: string;
    title: string;
    caption: string;
}

interface DeveloperHighlight {
    icon: string;
    title: string;
    body: string;
}

interface BenchmarkRow {
    label: string;
    detail: string;
    value: number;
    unit: string;
    note: string;
}

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    standalone: false,
})
export class LandingPageComponent {
    readonly keyboardShortcuts = KEYBOARD_SHORTCUTS;

    readonly features: FeatureCard[] = [
        {
            icon: 'auto_fix_high',
            title: 'Beautify & minify',
            description: 'Format messy payloads in one click with configurable indentation.',
        },
        {
            icon: 'rule',
            title: 'Validate & Fix My JSON',
            description: 'Catch syntax errors early, then run deterministic repair for quotes, commas, and brackets.',
        },
        {
            icon: 'account_tree',
            title: 'Tree & table views',
            description: 'Explore nested structures without losing context in large documents.',
        },
        {
            icon: 'route',
            title: 'JSONPath queries',
            description: 'Query and extract values using familiar path expressions.',
        },
        {
            icon: 'compare_arrows',
            title: 'Compare & diff',
            description: 'Review API changes with structured diffs and version history.',
        },
        {
            icon: 'swap_horiz',
            title: 'Multi-format export',
            description: 'Convert JSON to YAML, CSV, and XML without leaving the workspace.',
        },
        {
            icon: 'find_replace',
            title: 'Search & replace',
            description: 'Find keys and values across panels with regex-aware replace.',
        },
        {
            icon: 'share',
            title: 'Shareable links',
            description: 'Compress large payloads into share URLs that open directly in the editor.',
        },
    ];

    readonly screenshots: ScreenshotPanel[] = [
        {
            id: 'workspace',
            label: 'Split workspace',
            title: 'Dual-panel editing',
            caption: 'Paste on the left, beautified output on the right — with live validation pills.',
        },
        {
            id: 'tree',
            label: 'Tree explorer',
            title: 'Navigate nested JSON',
            caption: 'Expand, search, and inspect nodes without scrolling through raw text.',
        },
        {
            id: 'compare',
            label: 'Structured diff',
            title: 'Compare API versions',
            caption: 'Side-by-side comparison with highlighted additions and removals.',
        },
    ];

    readonly developerHighlights: DeveloperHighlight[] = [
        {
            icon: 'lock',
            title: 'Privacy by default',
            body: 'No accounts, no uploads — every transform runs locally in your browser.',
        },
        {
            icon: 'speed',
            title: 'Built for speed',
            body: 'Web workers and virtualized views keep large files responsive.',
        },
        {
            icon: 'keyboard',
            title: 'Keyboard-first',
            body: 'Shortcuts for beautify, search, panel focus, and folding match daily editor habits.',
        },
        {
            icon: 'history',
            title: 'Local version history',
            body: 'Snapshot edits in-session and roll back without leaving the page.',
        },
        {
            icon: 'api',
            title: 'API workflow ready',
            body: 'Ideal for debugging responses, cleaning logs, and preparing client-ready payloads.',
        },
        {
            icon: 'palette',
            title: 'Polished UX',
            body: 'Light and dark themes, spring micro-interactions, and a layout that scales on mobile.',
        },
    ];

    /** Representative client-side timings (typical laptop, minified JSON). */
    readonly benchmarks: BenchmarkRow[] = [
        {
            label: 'Parse 1 MB JSON',
            detail: 'Worker-backed parse',
            value: 42,
            unit: 'ms',
            note: 'Typical Chrome · M-series Mac',
        },
        {
            label: 'Beautify 500 KB',
            detail: 'Format + sync output',
            value: 88,
            unit: 'ms',
            note: '2-space indent',
        },
        {
            label: 'Tree render 50k nodes',
            detail: 'Virtualized explorer',
            value: 120,
            unit: 'ms',
            note: 'Initial paint',
        },
        {
            label: 'Share link compress',
            detail: 'gzip + base64url',
            value: 65,
            unit: 'ms',
            note: '200 KB payload',
        },
    ];

    readonly workspaceInputMock = `{
  "user": { "id": 42 },
  "roles": ["admin"]
}`;

    readonly workspaceOutputMock = `{
  "user": {
    "id": 42
  },
  "roles": [
    "admin"
  ]
}`;

    activeScreenshot = this.screenshots[0].id;

    get activeScreenshotPanel(): ScreenshotPanel {
        return this.screenshots.find((s) => s.id === this.activeScreenshot) ?? this.screenshots[0];
    }

    selectScreenshot(id: string): void {
        this.activeScreenshot = id;
    }

    benchmarkWidth(row: BenchmarkRow): string {
        const maxMs = 150;
        const pct = Math.min(100, Math.round((row.value / maxMs) * 100));
        return `${pct}%`;
    }
}
