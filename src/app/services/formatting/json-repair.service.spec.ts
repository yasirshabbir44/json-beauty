import {JsonRepairService} from './json-repair.service';

describe('JsonRepairService', () => {
    let service: JsonRepairService;

    beforeEach(() => {
        service = new JsonRepairService();
    });

    it('repairs unquoted keys and single quotes deterministically', () => {
        const broken = "{name: 'Alice', active: true}";
        const first = service.repair(broken);
        const second = service.repair(broken);

        expect(first.success).toBe(true);
        expect(second.repairedJson).toBe(first.repairedJson);
        expect(JSON.parse(first.repairedJson)).toEqual({name: 'Alice', active: true});
        expect(first.fixesApplied).toContain('missing-quotes');
        expect(first.fixesApplied).toContain('single-quotes');
    });

    it('removes trailing commas', () => {
        const broken = '{"items": [1, 2,], "ok": true,}';
        const result = service.repair(broken);

        expect(result.success).toBe(true);
        expect(JSON.parse(result.repairedJson)).toEqual({items: [1, 2], ok: true});
        expect(result.fixesApplied).toContain('trailing-commas');
    });

    it('closes unclosed brackets', () => {
        const broken = '{"nested": {"list": [1, 2';
        const result = service.repair(broken);

        expect(result.success).toBe(true);
        expect(JSON.parse(result.repairedJson)).toEqual({nested: {list: [1, 2]}});
        expect(result.fixesApplied).toContain('unclosed-brackets');
    });

    it('normalizes JSON5 comments via fallback', () => {
        const broken = '{\n  // user id\n  id: 1,\n  name: "test"\n}';
        const result = service.repair(broken);

        expect(result.success).toBe(true);
        expect(JSON.parse(result.repairedJson)).toEqual({id: 1, name: 'test'});
        expect(result.fixesApplied).toContain('json5-syntax');
    });

    it('returns unchanged formatted output for valid JSON', () => {
        const valid = '{"a":1}';
        const result = service.repair(valid);

        expect(result.success).toBe(true);
        expect(result.fixesApplied).toEqual([]);
        expect(JSON.parse(result.repairedJson)).toEqual({a: 1});
    });

    it('fails gracefully on irreparable input', () => {
        const result = service.repair('not json at all {{{');
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });
});
