import {SemanticHint} from '../../types/mock-data.types';

const SEMANTIC_RULES: ReadonlyArray<{ hint: SemanticHint; patterns: RegExp[] }> = [
    {hint: 'uuid', patterns: [/\b(uuid|guid|idempotency[-_]?key)\b/i, /(^|\.)id$/i, /\bid\b/i]},
    {hint: 'email', patterns: [/\b(e[-_]?mail|emailaddress)\b/i]},
    {hint: 'firstName', patterns: [/\b(first[-_]?name|given[-_]?name|fname)\b/i]},
    {hint: 'lastName', patterns: [/\b(last[-_]?name|family[-_]?name|surname|lname)\b/i]},
    {hint: 'personName', patterns: [/\b(full[-_]?name|display[-_]?name|name|customer[-_]?name)\b/i]},
    {hint: 'username', patterns: [/\b(user[-_]?name|login|handle|nickname)\b/i]},
    {
        hint: 'timestamp',
        patterns: [/\b(created[-_]?at|updated[-_]?at|modified[-_]?at|timestamp|datetime|occurred[-_]?at)\b/i]
    },
    {hint: 'date', patterns: [/\b(date|birthday|dob|start[-_]?date|end[-_]?date)\b/i]},
    {hint: 'url', patterns: [/\b(url|uri|href|link|website|homepage)\b/i]},
    {hint: 'phone', patterns: [/\b(phone|mobile|tel|telephone)\b/i]},
    {hint: 'address', patterns: [/\b(street|address|line1|line2)\b/i]},
    {hint: 'city', patterns: [/\b(city|town)\b/i]},
    {hint: 'country', patterns: [/\b(country|nation|region)\b/i]},
    {hint: 'postalCode', patterns: [/\b(zip|postal|postcode)\b/i]},
    {
        hint: 'description',
        patterns: [/\b(description|summary|bio|comment|message|notes|body|content)\b/i]
    },
    {hint: 'imageUrl', patterns: [/\b(avatar|image|img|photo|picture|thumbnail)\b/i]},
    {hint: 'status', patterns: [/\b(status|state|phase)\b/i]},
    {hint: 'token', patterns: [/\b(token|secret|api[-_]?key|password|hash)\b/i]},
    {hint: 'ipv4', patterns: [/\b(ip|ipv4|ipaddress)\b/i]},
    {hint: 'currency', patterns: [/\b(price|amount|total|cost|balance|salary)\b/i]},
    {hint: 'version', patterns: [/\b(version|semver|release)\b/i]},
    {
        hint: 'featureItem',
        patterns: [/\b(features|tags|capabilities|labels|permissions|roles|items)\[\]/i, /\b(features|tags|capabilities)\b/i]
    }
];

const SCHEMA_FORMAT_HINTS: Record<string, SemanticHint> = {
    'date-time': 'timestamp',
    date: 'date',
    email: 'email',
    uri: 'url',
    url: 'url',
    uuid: 'uuid',
    ipv4: 'ipv4',
    ipv6: 'ipv4'
};

/**
 * Infers a semantic hint from a JSON key, path, optional schema format, and value type.
 */
export function inferSemanticHint(
    key: string | undefined,
    path: string,
    kind: 'string' | 'number' | 'integer' | 'boolean',
    stringFormat?: string
): SemanticHint {
    if (stringFormat && SCHEMA_FORMAT_HINTS[stringFormat]) {
        return SCHEMA_FORMAT_HINTS[stringFormat];
    }

    const haystack = `${key ?? ''} ${path}`.toLowerCase();
    for (const rule of SEMANTIC_RULES) {
        if (rule.patterns.some((p) => p.test(haystack))) {
            return rule.hint;
        }
    }

    if (kind === 'boolean') {
        return 'genericBoolean';
    }
    if (kind === 'integer') {
        return 'genericInteger';
    }
    if (kind === 'number') {
        return 'genericNumber';
    }
    return 'genericString';
}
