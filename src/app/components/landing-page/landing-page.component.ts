import {Component} from '@angular/core';

interface HeroBullet {
    text: string;
}

interface PillarCard {
    icon: string;
    title: string;
    items: string[];
}

interface ToolCard {
    icon: string;
    title: string;
    description: string;
    bullets: string[];
    route: string;
    badge?: 'popular' | 'new';
    ctaLabel: string;
}

interface WorkflowFeature {
    icon: string;
    title: string;
    description: string;
}

interface FaqItem {
    question: string;
    answer: string;
}

interface ToolLink {
    label: string;
    route: string;
}

interface PreviewTab {
    id: string;
    label: string;
}

@Component({
    selector: 'app-landing-page',
    templateUrl: './landing-page.component.html',
    styleUrls: ['./landing-page.component.scss'],
    standalone: false,
})
export class LandingPageComponent {
    readonly heroBullets: HeroBullet[] = [
        {text: 'No uploads: your input stays on your device'},
        {text: 'Fast: optimized for API responses and large payloads'},
        {text: 'Developer UX: validation, diffs, tree views, exports'},
    ];

    readonly previewTabs: PreviewTab[] = [
        {id: 'validate', label: 'Validate'},
        {id: 'format', label: 'Format'},
        {id: 'minify', label: 'Minify'},
        {id: 'tree', label: 'Tree View'},
    ];

    activePreviewTab = 'format';

    readonly previewSample = `{
    "name": "JSON Beauty",
    "version": "1.0.0",
    "features": [
        "JSON formatting",
        "Validation",
        "Conversion"
    ],
    "stats": {
        "users": 12500,
        "rating": 4.9
    }
}`;

    readonly pillars: PillarCard[] = [
        {
            icon: 'code',
            title: 'Developer-focused tools',
            items: [
                'Format, diff, repair, and convert JSON',
                'Tree view, JSONPath, and search & replace',
                'Works in-browser — no backend required',
            ],
        },
        {
            icon: 'shield',
            title: 'Secure by default',
            items: [
                'No uploads required to process your input',
                'Runs client-side in your browser',
                'Offline-ready PWA with service worker',
            ],
        },
        {
            icon: 'bolt',
            title: 'Blazing fast, no friction',
            items: [
                'Opens instantly, zero setup',
                'No sign-up, no API keys',
                'Use what you need, when you need it',
            ],
        },
    ];

    readonly featuredTools: ToolCard[] = [
        {
            icon: 'data_object',
            title: 'JSON Formatter',
            description:
                'Professional JSON formatter with real-time validation, syntax highlighting, tree view, and multi-format conversion.',
            bullets: [
                'Real-time validation',
                'Convert to XML / CSV / YAML',
                'Interactive tree view',
            ],
            route: '/editor',
            badge: 'popular',
            ctaLabel: 'Open Tool',
        },
        {
            icon: 'compare_arrows',
            title: 'JSON Compare',
            description:
                'Side-by-side comparison with visual diff highlighting, change tracking, and version history for API debugging.',
            bullets: [
                'Visual diff view',
                'Structured change tracking',
                'Session version history',
            ],
            route: '/editor',
            badge: 'popular',
            ctaLabel: 'Open Tool',
        },
        {
            icon: 'build_circle',
            title: 'JSON Repair',
            description:
                'Fix broken JSON automatically: quotes, commas, brackets, and common dev formats. Great for malformed API responses and LLM outputs.',
            bullets: [
                'One-click repair',
                'Deterministic fixes',
                'Runs locally — no uploads',
            ],
            route: '/editor',
            badge: 'new',
            ctaLabel: 'Open Tool',
        },
        {
            icon: 'account_tree',
            title: 'JSON Editor',
            description:
                'Visual JSON editor with tree view and Ace editor. Inline editing, search, JSONPath queries, and context-aware navigation.',
            bullets: [
                'Tree & code editor modes',
                'JSONPath extraction',
                'Inline editing & validation',
            ],
            route: '/editor',
            badge: 'new',
            ctaLabel: 'Open Tool',
        },
        {
            icon: 'rule',
            title: 'JSON Validator',
            description:
                'Strict syntax checks with clear error locations. Pinpoint line and column issues before shipping payloads.',
            bullets: [
                'Syntax error highlighting',
                'Line / column focus',
                'Live validation pills',
            ],
            route: '/editor',
            ctaLabel: 'Open Tool',
        },
        {
            icon: 'swap_horiz',
            title: 'Format Converter',
            description:
                'Convert JSON to YAML, CSV, and XML with sensible defaults. Export clean output for configs, APIs, and spreadsheets.',
            bullets: [
                'JSON ↔ YAML / XML / CSV',
                'Copy & download',
                'Client-side conversion',
            ],
            route: '/editor',
            ctaLabel: 'Open Tool',
        },
    ];

    readonly devToolValues = [
        {
            icon: 'cloud_off',
            title: 'No uploads',
            description:
                'Your JSON is processed in your browser. Great for sensitive payloads and confidential configs.',
        },
        {
            icon: 'devices',
            title: 'Local-first workflow',
            description:
                'Paste, validate, repair, compare, convert, and export — without sending your input to a processing server.',
        },
        {
            icon: 'person_off',
            title: 'Use what you need',
            description: 'No registration required. Use the tools you need, when you need them.',
        },
    ];

    readonly workflowFeatures: WorkflowFeature[] = [
        {
            icon: 'fact_check',
            title: 'Validate & pinpoint errors',
            description:
                'Clear error messages with line/column focus so you can fix broken payloads quickly.',
        },
        {
            icon: 'auto_fix_high',
            title: 'Repair malformed JSON',
            description:
                'One-click fixes for common issues — great for logs and LLM outputs.',
        },
        {
            icon: 'difference',
            title: 'Compare changes',
            description:
                'Side-by-side diffs for config edits, API regressions, and contract changes.',
        },
        {
            icon: 'transform',
            title: 'Convert between formats',
            description:
                'JSON ↔ CSV / XML / YAML — with clean output and sensible defaults.',
        },
        {
            icon: 'account_tree',
            title: 'Inspect structure',
            description:
                'Tree views, syntax highlighting, search, and navigation for nested objects and arrays.',
        },
        {
            icon: 'tune',
            title: 'Tunable output',
            description:
                'Indentation, sorting, wrapping, minify/beautify, and export options that match team conventions.',
        },
    ];

    readonly toolLinks: ToolLink[] = [
        {label: 'JSON Formatter', route: '/editor'},
        {label: 'JSON Validator', route: '/editor'},
        {label: 'JSON Compare', route: '/editor'},
        {label: 'JSON Repair', route: '/editor'},
        {label: 'JSON Editor', route: '/editor'},
        {label: 'JSON Minifier', route: '/editor'},
        {label: 'JSONPath', route: '/editor'},
        {label: 'JSON to CSV', route: '/editor'},
        {label: 'JSON to XML', route: '/editor'},
        {label: 'JSON to YAML', route: '/editor'},
        {label: 'Search & Replace', route: '/editor'},
        {label: 'Share links', route: '/editor'},
    ];

    readonly faqItems: FaqItem[] = [
        {
            question: 'How do I format JSON data?',
            answer:
                'Paste your JSON into the editor and click Format (or use the beautify shortcut). The tool beautifies with proper indentation and syntax highlighting. Adjust indentation size in settings.',
        },
        {
            question: 'Can I validate JSON syntax?',
            answer:
                'Yes. Validation runs in real time as you type. For messy inputs from logs or LLM output, use Fix My JSON to repair quotes, commas, and brackets first.',
        },
        {
            question: 'Is there a limit to file size?',
            answer:
                'Most processing happens in-browser and handles large files well (often up to ~10MB depending on your device). For very large payloads, focusing on a subset is usually fastest.',
        },
        {
            question: 'Do you support XML and YAML?',
            answer:
                'Yes — convert JSON to and from XML, YAML, and CSV directly in the editor workspace without leaving the page.',
        },
        {
            question: 'Is JSON Beauty free to use?',
            answer:
                'Yes. Core formatting, validation, comparison, and conversion are free with no signup. Optional support tips help fund improvements — there are no paywalls on essentials.',
        },
        {
            question: 'Can I use these tools for sensitive data?',
            answer:
                'Yes — all formatting, validation, and conversion run locally in your browser. Your data is not uploaded to a server. After the first load you can also use the site offline as a PWA.',
        },
    ];

    selectPreviewTab(id: string): void {
        this.activePreviewTab = id;
    }

    badgeLabel(badge: ToolCard['badge']): string {
        if (badge === 'popular') {
            return 'Most Popular';
        }
        if (badge === 'new') {
            return 'New';
        }
        return '';
    }
}
