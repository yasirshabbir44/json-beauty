/**
 * Cached dynamic imports for heavy npm packages.
 * Keeps them out of the initial bundle until first use (or editor preload).
 */

type Json5Module = typeof import('json5');
type YamlModule = typeof import('js-yaml');
type Xml2JsModule = typeof import('xml2js');
type AjvModule = typeof import('ajv');
type JsondiffpatchModule = typeof import('jsondiffpatch');
type JsonpathModule = typeof import('jsonpath');
type JsonrepairModule = typeof import('jsonrepair');
type GenerateSchemaModule = typeof import('generate-schema');

let json5Module: Json5Module | undefined;
let yamlModule: YamlModule | undefined;
let xml2jsModule: Xml2JsModule | undefined;
let ajvCtor: (new (options?: object) => import('ajv').default) | undefined;
let jsondiffpatchModule: JsondiffpatchModule | undefined;
let jsonpathModule: JsonpathModule | undefined;
let jsonrepairFn: JsonrepairModule['jsonrepair'] | undefined;
let generateSchemaFn: GenerateSchemaModule['json'] | undefined;

export function getJson5Sync(): Json5Module | undefined {
    return json5Module;
}

export function loadJson5(): Promise<Json5Module> {
    if (!json5Module) {
        return import('json5').then((mod) => {
            json5Module = mod;
            return mod;
        });
    }
    return Promise.resolve(json5Module);
}

export function loadYaml(): Promise<YamlModule> {
    if (!yamlModule) {
        return import('js-yaml').then((mod) => {
            yamlModule = mod;
            return mod;
        });
    }
    return Promise.resolve(yamlModule);
}

export function loadXml2js(): Promise<Xml2JsModule> {
    if (!xml2jsModule) {
        return import('xml2js').then((mod) => {
            xml2jsModule = mod;
            return mod;
        });
    }
    return Promise.resolve(xml2jsModule);
}

export async function createAjv(options?: object): Promise<import('ajv').default> {
    if (!ajvCtor) {
        const mod = await import('ajv');
        ajvCtor = mod.default;
    }
    return new ajvCtor(options);
}

export function loadJsondiffpatch(): Promise<JsondiffpatchModule> {
    if (!jsondiffpatchModule) {
        return import('jsondiffpatch').then((mod) => {
            jsondiffpatchModule = mod;
            return mod;
        });
    }
    return Promise.resolve(jsondiffpatchModule);
}

export function loadJsonpath(): Promise<JsonpathModule> {
    if (!jsonpathModule) {
        return import('jsonpath').then((mod) => {
            jsonpathModule = mod;
            return mod;
        });
    }
    return Promise.resolve(jsonpathModule);
}

export async function loadJsonrepair(): Promise<JsonrepairModule['jsonrepair']> {
    if (!jsonrepairFn) {
        const mod = await import('jsonrepair');
        jsonrepairFn = mod.jsonrepair;
    }
    return jsonrepairFn;
}

export async function loadGenerateSchema(): Promise<GenerateSchemaModule['json']> {
    if (!generateSchemaFn) {
        const mod = await import('generate-schema');
        generateSchemaFn = mod.json;
    }
    return generateSchemaFn;
}
