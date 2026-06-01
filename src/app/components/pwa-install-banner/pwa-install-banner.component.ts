import {Component, inject} from '@angular/core';
import {PwaService} from '../../services/pwa/pwa.service';

@Component({
    selector: 'app-pwa-install-banner',
    templateUrl: './pwa-install-banner.component.html',
    styleUrls: ['./pwa-install-banner.component.scss'],
    standalone: false
})
export class PwaInstallBannerComponent {
    readonly pwa = inject(PwaService);

    onInstall(): void {
        this.pwa.openInstallFlow();
    }

    onDismiss(): void {
        this.pwa.dismissInstallBanner();
    }
}
