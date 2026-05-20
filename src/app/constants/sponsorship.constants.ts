/**
 * Optional sponsorship / monetization links.
 * Set URLs to show buttons in the footer and on /support; leave null to hide a channel.
 */
export const SponsorshipConstants = {
    buyMeACoffeeUrl: 'https://buymeacoffee.com/yasir44',

    /** e.g. https://github.com/sponsors/yourusername */
    githubSponsorsUrl: null as string | null,

    /** Always shown when sponsorship section is enabled */
    githubRepoUrl: 'https://github.com/yasirshabbir44/json-beauty',

    /** Show planned Pro tier comparison on the support page */
    showProRoadmap: true,
};

export interface TierFeature {
    label: string;
    free: string;
    pro: string;
}

export const PRO_TIER_FEATURES: TierFeature[] = [
    {label: 'JSON editing & formatting', free: 'Included', pro: 'Included'},
    {label: 'Converters (YAML, XML, CSV, JSON5)', free: 'Included', pro: 'Included + more formats'},
    {label: 'Compare, JSONPath, search & replace', free: 'Included', pro: 'Included'},
    {label: 'Share via URL', free: 'Static link', pro: 'Live collaborative sessions'},
    {label: 'Version history', free: 'Local (browser)', pro: 'Unlimited + cloud sync'},
    {label: 'Document size', free: 'Browser limits only', pro: 'Higher limits + API'},
    {label: 'API access', free: '—', pro: 'REST API for automation'},
    {label: 'Accounts & billing', free: 'None required', pro: 'Optional team plans'},
];
