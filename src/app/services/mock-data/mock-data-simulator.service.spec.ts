import {TestBed} from '@angular/core/testing';
import {MockDataSimulatorService} from './mock-data-simulator.service';

describe('MockDataSimulatorService', () => {
    let service: MockDataSimulatorService;

    const sampleJson = JSON.stringify({
        id: '550e8400-e29b-41d4-a716-446655440000',
        user: {
            email: 'demo@example.com',
            firstName: 'Ada',
            lastName: 'Lovelace',
            createdAt: '2024-01-15T10:30:00.000Z'
        },
        tags: ['alpha', 'beta'],
        active: true,
        score: 42
    });

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [MockDataSimulatorService]
        });
        service = TestBed.inject(MockDataSimulatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should finalize a blueprint from JSON sample', () => {
        const blueprint = service.buildBlueprintFromJson(sampleJson);
        expect(blueprint.finalized).toBeTrue();
        expect(blueprint.source).toBe('json-sample');
        expect(blueprint.root.kind).toBe('object');
        expect(blueprint.root.properties?.['user']?.kind).toBe('object');
    });

    it('should generate structurally compliant mock data', () => {
        const blueprint = service.buildBlueprintFromJson(sampleJson);
        const mock = JSON.parse(service.generateMockDataset(blueprint, {seed: 42}));
        const source = JSON.parse(sampleJson);

        expect(typeof mock.id).toBe('string');
        expect(typeof mock.user).toBe('object');
        expect(typeof mock.user.email).toBe('string');
        expect(mock.user.email).toContain('@');
        expect(Array.isArray(mock.tags)).toBeTrue();
        expect(mock.tags.length).toBe(2);
        expect(typeof mock.active).toBe('boolean');
        expect(typeof mock.score).toBe('number');
        // Must produce fresh values, not echo the sample payload
        expect(mock.id).not.toBe(source.id);
        expect(mock.user.email).not.toBe(source.user.email);
        expect(mock.user.firstName).not.toBe(source.user.firstName);
    });

    it('should be deterministic for the same seed', () => {
        const blueprint = service.buildBlueprintFromJson(sampleJson);
        const first = service.generateMockDataset(blueprint, {seed: 'test-seed'});
        const second = service.generateMockDataset(blueprint, {seed: 'test-seed'});
        expect(first).toBe(second);
    });

    it('should produce different data for different seeds', () => {
        const blueprint = service.buildBlueprintFromJson(sampleJson);
        const a = service.generateMockDataset(blueprint, {seed: 'seed-a'});
        const b = service.generateMockDataset(blueprint, {seed: 'seed-b'});
        expect(a).not.toBe(b);
    });

    it('should infer context from field names', () => {
        const blueprint = service.buildBlueprintFromJson(sampleJson);
        const mock = JSON.parse(service.generateMockDataset(blueprint, {seed: 1}));
        expect(mock.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(mock.id).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
    });

    it('should generate semver and feature words in auto mode', () => {
        const json = JSON.stringify({
            name: 'App',
            version: '0.0.0',
            features: ['old-a', 'old-b']
        });
        const mock = JSON.parse(service.generateFromJsonSample(json, {seed: 7, mode: 'auto'}));
        expect(mock.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(mock.features.every((f: string) => typeof f === 'string' && !f.startsWith('value_'))).toBeTrue();
    });

    it('should use custom string style and field overrides', () => {
        const json = JSON.stringify({
            name: 'App',
            version: '0.0.0',
            features: ['a']
        });
        const mock = JSON.parse(
            service.generateFromJsonSample(json, {
                seed: 1,
                mode: 'custom',
                custom: {
                    stringStyle: 'sequential',
                    stringPrefix: 'feat_',
                    fieldOverrides: {version: '9.9.9', name: 'Pinned Name'}
                }
            })
        );
        expect(mock.version).toBe('9.9.9');
        expect(mock.name).toBe('Pinned Name');
        expect(mock.features[0]).toBe('feat_1');
    });

    it('should build blueprint from JSON Schema', () => {
        const schema = JSON.stringify({
            type: 'object',
            properties: {
                email: {type: 'string', format: 'email'},
                count: {type: 'integer', minimum: 1, maximum: 10}
            },
            required: ['email', 'count']
        });
        const blueprint = service.buildBlueprintFromSchema(schema);
        expect(blueprint.source).toBe('json-schema');
        const mock = JSON.parse(service.generateFromSchema(schema, {seed: 99}));
        expect(mock.email).toContain('@');
        expect(mock.count).toBeGreaterThanOrEqual(1);
        expect(mock.count).toBeLessThanOrEqual(10);
    });
});
