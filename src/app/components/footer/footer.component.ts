import {Component, Input} from '@angular/core';
import {SponsorshipConstants} from '../../constants/sponsorship.constants';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    standalone: false
})
export class FooterComponent {
    @Input() tagline = '';
    currentYear = new Date().getFullYear();

    readonly buyMeACoffeeUrl = SponsorshipConstants.buyMeACoffeeUrl;
    readonly githubSponsorsUrl = SponsorshipConstants.githubSponsorsUrl;
    readonly githubRepoUrl = SponsorshipConstants.githubRepoUrl;
    readonly showProRoadmap = SponsorshipConstants.showProRoadmap;
}
