import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

export interface NumericChartDatum {
    path: string;
    value: number;
}

export interface VisualizationSummary {
    rootType: 'object' | 'array' | 'primitive';
    propertyCount: number;
    arrayItemCount: number;
    maxDepth: number;
    numericFields: NumericChartDatum[];
}

@Component({
    selector: 'app-json-visualization',
    templateUrl: './json-visualization.component.html',
    styleUrls: ['./json-visualization.component.scss'],
    standalone: false
})
export class JsonVisualizationComponent implements OnInit, OnChanges {
    @Input() jsonData: unknown = null;

    visualizationData: unknown = null;
    summary: VisualizationSummary | null = null;
    expandedNodes = new Set<string>(['$']);
    readonly maxChartBars = 12;

    ngOnInit(): void {
        this.initializeVisualization();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['jsonData']) {
            this.initializeVisualization();
        }
    }

    initializeVisualization(): void {
        if (this.jsonData == null || this.jsonData === '') {
            this.visualizationData = null;
            this.summary = null;
            return;
        }

        try {
            if (typeof this.jsonData === 'string') {
                this.visualizationData = JSON.parse(this.jsonData);
            } else {
                this.visualizationData = this.jsonData;
            }
            this.summary = this.buildSummary(this.visualizationData);
            this.expandedNodes = new Set<string>(['$']);
        } catch (error) {
            console.error('Error initializing visualization:', error);
            this.visualizationData = null;
            this.summary = null;
        }
    }

    get chartMaxValue(): number {
        const values = this.summary?.numericFields.map(d => Math.abs(d.value)) ?? [];
        return values.length ? Math.max(...values) : 1;
    }

    get chartData(): NumericChartDatum[] {
        return (this.summary?.numericFields ?? []).slice(0, this.maxChartBars);
    }

    get hasChartData(): boolean {
        return this.chartData.length > 0;
    }

    getObjectKeys(obj: unknown): string[] {
        if (!obj || typeof obj !== 'object') {
            return [];
        }
        return Object.keys(obj);
    }

    isExpandable(value: unknown): boolean {
        return (this.isObject(value) || this.isArray(value)) &&
            (this.isArray(value) ? value.length > 0 : Object.keys(value as object).length > 0);
    }

    toggleNode(nodeId: string): void {
        if (this.expandedNodes.has(nodeId)) {
            this.expandedNodes.delete(nodeId);
        } else {
            this.expandedNodes.add(nodeId);
        }
    }

    isNodeExpanded(nodeId: string): boolean {
        return this.expandedNodes.has(nodeId);
    }

    expandAll(): void {
        if (!this.visualizationData) {
            return;
        }
        this.expandedNodes = this.collectExpandablePaths(this.visualizationData, '$');
    }

    collapseAll(): void {
        this.expandedNodes = new Set<string>(['$']);
    }

    isString(value: unknown): boolean {
        return typeof value === 'string';
    }

    isNumber(value: unknown): boolean {
        return typeof value === 'number' && Number.isFinite(value);
    }

    isBoolean(value: unknown): boolean {
        return typeof value === 'boolean';
    }

    isArray(value: unknown): value is unknown[] {
        return Array.isArray(value);
    }

    isObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    formatValue(value: unknown): string {
        if (value === null) {
            return 'null';
        }
        if (value === undefined) {
            return 'undefined';
        }
        if (this.isString(value)) {
            return `"${value}"`;
        }
        return String(value);
    }

    getNodeLabel(path: string): string {
        if (path === '$') {
            return 'root';
        }
        const segments = path.replace(/\[\d+\]/g, match => `.${match.slice(1, -1)}`).split('.');
        return segments[segments.length - 1] || path;
    }

    getBarWidth(value: number): number {
        const max = this.chartMaxValue;
        if (max === 0) {
            return 0;
        }
        return Math.max(4, (Math.abs(value) / max) * 100);
    }

    private buildSummary(data: unknown): VisualizationSummary {
        const numericFields: NumericChartDatum[] = [];
        this.collectNumericFields(data, '$', numericFields);

        return {
            rootType: this.isArray(data) ? 'array' : this.isObject(data) ? 'object' : 'primitive',
            propertyCount: this.isObject(data) ? Object.keys(data).length : 0,
            arrayItemCount: this.isArray(data) ? data.length : 0,
            maxDepth: this.measureDepth(data),
            numericFields: numericFields.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
        };
    }

    private collectNumericFields(value: unknown, path: string, out: NumericChartDatum[]): void {
        if (typeof value === 'number' && Number.isFinite(value)) {
            out.push({ path, value });
            return;
        }
        if (this.isArray(value)) {
            value.forEach((item, index) => {
                this.collectNumericFields(item, `${path}[${index}]`, out);
            });
            return;
        }
        if (this.isObject(value)) {
            for (const key of Object.keys(value)) {
                const childPath = path === '$' ? key : `${path}.${key}`;
                this.collectNumericFields(value[key], childPath, out);
            }
        }
    }

    private measureDepth(value: unknown): number {
        if (!this.isObject(value) && !this.isArray(value)) {
            return 0;
        }
        if (this.isArray(value)) {
            if (value.length === 0) {
                return 1;
            }
            return 1 + Math.max(...value.map(item => this.measureDepth(item)));
        }
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return 1;
        }
        return 1 + Math.max(...keys.map(key => this.measureDepth(value[key])));
    }

    private collectExpandablePaths(value: unknown, path: string): Set<string> {
        const paths = new Set<string>([path]);
        if (this.isArray(value)) {
            value.forEach((item, index) => {
                const childPath = `${path}[${index}]`;
                if (this.isExpandable(item)) {
                    this.collectExpandablePaths(item, childPath).forEach(p => paths.add(p));
                }
            });
            return paths;
        }
        if (this.isObject(value)) {
            for (const key of Object.keys(value)) {
                const childPath = path === '$' ? key : `${path}.${key}`;
                const child = value[key];
                if (this.isExpandable(child)) {
                    this.collectExpandablePaths(child, childPath).forEach(p => paths.add(p));
                }
            }
        }
        return paths;
    }
}
