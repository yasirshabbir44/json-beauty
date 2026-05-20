import {Component} from '@angular/core';
import {
    PRO_TIER_FEATURES,
    SponsorshipConstants,
    TierFeature,
} from '../../constants/sponsorship.constants';

export interface SupportLink {
    id: string;
    label: string;
    description: string;
    href: string;
    icon: string;
    external: boolean;
}

@Component({
    selector: 'app-support-page',
    templateUrl: './support-page.component.html',
    styleUrls: ['./support-page.component.scss'],
    standalone: false,
})
export class SupportPageComponent {
    readonly showProRoadmap = SponsorshipConstants.showProRoadmap;
    readonly tierFeatures: TierFeature[] = PRO_TIER_FEATURES;
    readonly supportLinks: SupportLink[] = this.buildSupportLinks();

    private buildSupportLinks(): SupportLink[] {
        const links: SupportLink[] = [
            {
                id: 'github',
                label: 'Star on GitHub',
                description: 'Helps others discover the project and motivates ongoing maintenance.',
                href: SponsorshipConstants.githubRepoUrl,
                icon: 'star',
                external: true,
            },
        ];

        if (SponsorshipConstants.buyMeACoffeeUrl) {
            links.push({
                id: 'bmc',
                label: 'Buy me a coffee',
                description: 'One-time tip to say thanks — no account or subscription.',
                href: SponsorshipConstants.buyMeACoffeeUrl,
                icon: 'local_cafe',
                external: true,
            });
        }

        if (SponsorshipConstants.githubSponsorsUrl) {
            links.push({
                id: 'sponsors',
                label: 'GitHub Sponsors',
                description: 'Recurring support for sustained development.',
                href: SponsorshipConstants.githubSponsorsUrl,
                icon: 'favorite',
                external: true,
            });
        }

        return links;
    }
}
