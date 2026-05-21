import {Injectable} from '@angular/core';
import {JsonValue} from '../../types/json.types';
import {IMockDataSimulatorService} from '../../interfaces/json-mock-data.interface';
import {
    BlueprintNode,
    MockDataCustomSettings,
    MockDataSimulatorOptions,
    MockDataStringStyle,
    StructureBlueprint
} from '../../types/mock-data.types';
import {DeterministicRng} from './deterministic-rng';
import {applyFieldOverrides, resolveFieldOverride} from './mock-data-overrides';
import {StructureBlueprintBuilder} from './structure-blueprint.builder';

const FIRST_NAMES = ['Alex', 'Jordan', 'Sam', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn'] as const;
const LAST_NAMES = ['Chen', 'Patel', 'Nguyen', 'Garcia', 'Kim', 'Brooks', 'Reed', 'Hayes'] as const;
const CITIES = ['Austin', 'Seattle', 'Denver', 'Boston', 'Portland', 'Chicago', 'Atlanta'] as const;
const COUNTRIES = ['US', 'CA', 'GB', 'DE', 'AU', 'IN', 'SG'] as const;
const STATUSES = ['active', 'pending', 'completed', 'archived', 'failed'] as const;
const DESCRIPTIONS = [
    'Quarterly review completed successfully.',
    'Automated sync finished with no conflicts.',
    'Customer requested a follow-up next week.',
    'Payload validated against the service contract.'
] as const;
const FEATURE_WORDS = [
    'analytics',
    'export',
    'import',
    'notifications',
    'search',
    'filtering',
    'api-access',
    'sso',
    'audit-log',
    'webhooks',
    'dashboard',
    'reporting'
] as const;
const LOREM_WORDS = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do'
] as const;

const DEFAULT_CUSTOM: MockDataCustomSettings = {
    stringStyle: 'placeholder',
    stringPrefix: 'value_',
    numberMin: 0,
    numberMax: 1000
};

@Injectable({
    providedIn: 'root'
})
export class MockDataSimulatorService implements IMockDataSimulatorService {
    private readonly blueprintBuilder = new StructureBlueprintBuilder();
    private sequentialCounters: Record<string, number> = {};

    buildBlueprintFromJson(jsonString: string): StructureBlueprint {
        return this.blueprintBuilder.finalizeFromJsonSample(jsonString);
    }

    buildBlueprintFromSchema(schemaString: string): StructureBlueprint {
        return this.blueprintBuilder.finalizeFromJsonSchema(schemaString);
    }

    generateMockDataset(
        blueprint: StructureBlueprint,
        options: MockDataSimulatorOptions = {}
    ): string {
        this.sequentialCounters = {};
        const rng = new DeterministicRng(options.seed ?? 'json-beauty-mock');
        let data = this.generateNode(blueprint.root, rng, options);
        const custom = this.resolveCustomSettings(options);
        if (custom.fieldOverrides && Object.keys(custom.fieldOverrides).length > 0) {
            data = applyFieldOverrides(data, custom.fieldOverrides);
        }
        const pretty = options.pretty !== false;
        return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    generateFromJsonSample(jsonString: string, options?: MockDataSimulatorOptions): string {
        const blueprint = this.buildBlueprintFromJson(jsonString);
        return this.generateMockDataset(blueprint, options);
    }

    generateFromSchema(schemaString: string, options?: MockDataSimulatorOptions): string {
        const blueprint = this.buildBlueprintFromSchema(schemaString);
        return this.generateMockDataset(blueprint, options);
    }

    private resolveCustomSettings(options: MockDataSimulatorOptions): MockDataCustomSettings {
        return {
            ...DEFAULT_CUSTOM,
            ...options.custom
        };
    }

    private isCustomMode(options: MockDataSimulatorOptions): boolean {
        return options.mode === 'custom';
    }

    private generateNode(
        node: BlueprintNode,
        rng: DeterministicRng,
        options: MockDataSimulatorOptions
    ): JsonValue {
        const custom = this.resolveCustomSettings(options);
        const override = resolveFieldOverride(
            custom.fieldOverrides,
            node.context.path,
            node.context.key
        );
        if (override !== undefined) {
            return JSON.parse(JSON.stringify(override)) as JsonValue;
        }

        if (node.enumValues && node.enumValues.length > 0) {
            return rng.pick(node.enumValues) as JsonValue;
        }

        switch (node.kind) {
            case 'null':
                return null;
            case 'boolean':
                return this.isCustomMode(options) ? rng.next() > 0.5 : rng.next() > 0.5;
            case 'integer':
                return this.randomInteger(node, rng, options);
            case 'number':
                return this.randomNumber(node, rng, options);
            case 'string':
                return this.randomString(node, rng, options);
            case 'array': {
                const length = node.arrayLength ?? options.arrayLength ?? 3;
                const template = node.itemTemplate ?? {
                    kind: 'string',
                    context: {path: `${node.context.path}[]`, semantic: 'genericString'}
                };
                return Array.from({length}, () => this.generateNode(template, rng, options));
            }
            case 'object': {
                const result: Record<string, JsonValue> = {};
                const keys = node.propertyOrder ?? Object.keys(node.properties ?? {});
                for (const key of keys) {
                    const child = node.properties?.[key];
                    if (child) {
                        result[key] = this.generateNode(child, rng, options);
                    }
                }
                return result;
            }
            default:
                return null;
        }
    }

    private randomInteger(
        node: BlueprintNode,
        rng: DeterministicRng,
        options: MockDataSimulatorOptions
    ): number {
        if (this.isCustomMode(options)) {
            const custom = this.resolveCustomSettings(options);
            const min = custom.numberMin ?? 0;
            const max = custom.numberMax ?? 1000;
            return rng.nextInt(min, max);
        }
        const min = node.minimum ?? 0;
        const max = node.maximum ?? 10_000;
        return rng.nextInt(min, max);
    }

    private randomNumber(
        node: BlueprintNode,
        rng: DeterministicRng,
        options: MockDataSimulatorOptions
    ): number {
        if (this.isCustomMode(options)) {
            const custom = this.resolveCustomSettings(options);
            const min = custom.numberMin ?? 0;
            const max = custom.numberMax ?? 1000;
            const value = min + rng.next() * (max - min);
            return Math.round(value * 100) / 100;
        }
        if (node.context.semantic === 'currency') {
            return Math.round((rng.nextInt(1, 500) + rng.next()) * 100) / 100;
        }
        const min = node.minimum ?? 0;
        const max = node.maximum ?? 10_000;
        const value = min + rng.next() * (max - min);
        return Math.round(value * 100) / 100;
    }

    private randomString(
        node: BlueprintNode,
        rng: DeterministicRng,
        options: MockDataSimulatorOptions
    ): string {
        if (this.isCustomMode(options)) {
            return this.customString(node, rng, this.resolveCustomSettings(options));
        }
        return this.autoString(node, rng);
    }

    private autoString(node: BlueprintNode, rng: DeterministicRng): string {
        const hint = node.context.semantic;
        switch (hint) {
            case 'uuid':
                return this.formatUuid(rng);
            case 'email':
                return `${rng.pick(FIRST_NAMES).toLowerCase()}.${rng.pick(LAST_NAMES).toLowerCase()}@example.com`;
            case 'firstName':
                return rng.pick(FIRST_NAMES);
            case 'lastName':
                return rng.pick(LAST_NAMES);
            case 'personName':
                return `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
            case 'username':
                return `${rng.pick(FIRST_NAMES).toLowerCase()}_${rng.nextInt(10, 9999)}`;
            case 'timestamp':
                return new Date(
                    Date.UTC(
                        2020 + rng.nextInt(0, 5),
                        rng.nextInt(0, 11),
                        rng.nextInt(1, 28),
                        rng.nextInt(0, 23),
                        rng.nextInt(0, 59),
                        rng.nextInt(0, 59)
                    )
                ).toISOString();
            case 'date':
                return new Date(Date.UTC(2020 + rng.nextInt(0, 5), rng.nextInt(0, 11), rng.nextInt(1, 28)))
                    .toISOString()
                    .slice(0, 10);
            case 'url':
            case 'imageUrl':
                return `https://example.com/${rng.pick(['users', 'assets', 'items'])}/${rng.nextInt(1000, 99999)}`;
            case 'phone':
                return `+1-${rng.nextInt(200, 999)}-${rng.nextInt(200, 999)}-${rng.nextInt(1000, 9999)}`;
            case 'address':
                return `${rng.nextInt(100, 9999)} ${rng.pick(['Oak', 'Maple', 'Cedar', 'Pine'])} St`;
            case 'city':
                return rng.pick(CITIES);
            case 'country':
                return rng.pick(COUNTRIES);
            case 'postalCode':
                return String(rng.nextInt(10000, 99999));
            case 'description':
                return rng.pick(DESCRIPTIONS);
            case 'status':
                return rng.pick(STATUSES);
            case 'token':
                return this.randomHex(rng, 32);
            case 'ipv4':
                return `${rng.nextInt(1, 255)}.${rng.nextInt(0, 255)}.${rng.nextInt(0, 255)}.${rng.nextInt(1, 254)}`;
            case 'version':
                return `${rng.nextInt(1, 3)}.${rng.nextInt(0, 12)}.${rng.nextInt(0, 20)}`;
            case 'featureItem':
                return rng.pick(FEATURE_WORDS);
            default:
                return `value_${this.randomHex(rng, 8)}`;
        }
    }

    private customString(
        node: BlueprintNode,
        rng: DeterministicRng,
        custom: MockDataCustomSettings
    ): string {
        const path = node.context.path || node.context.key || 'field';
        switch (custom.stringStyle) {
            case 'lorem': {
                const words = rng.nextInt(2, 4);
                const parts: string[] = [];
                for (let i = 0; i < words; i++) {
                    parts.push(rng.pick(LOREM_WORDS));
                }
                return parts.join(' ');
            }
            case 'sequential': {
                this.sequentialCounters[path] = (this.sequentialCounters[path] ?? 0) + 1;
                const prefix = custom.stringPrefix ?? 'item_';
                return `${prefix}${this.sequentialCounters[path]}`;
            }
            case 'words':
                return rng.pick(FEATURE_WORDS);
            case 'placeholder':
            default: {
                const prefix = custom.stringPrefix ?? 'value_';
                return `${prefix}${this.randomHex(rng, 8)}`;
            }
        }
    }

    private formatUuid(rng: DeterministicRng): string {
        const hex = () => this.randomHex(rng, 4);
        return `${hex()}${hex()}-${hex()}-4${this.randomHex(rng, 3)}-${['8', '9', 'a', 'b'][rng.nextInt(0, 3)]}${this.randomHex(rng, 3)}-${hex()}${hex()}${hex()}`;
    }

    private randomHex(rng: DeterministicRng, length: number): string {
        const chars = '0123456789abcdef';
        let out = '';
        for (let i = 0; i < length; i++) {
            out += chars[rng.nextInt(0, 15)];
        }
        return out;
    }
}
