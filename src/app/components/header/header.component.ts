import {Component, Input, inject} from '@angular/core';
import {Router} from '@angular/router';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    standalone: false
})
export class HeaderComponent {
    @Input() title: string = '';
    @Input() subtitle: string = '';

    private readonly router = inject(Router);

    onLogoClick(event: MouseEvent): void {
        const path = this.router.url.split('?')[0].split('#')[0];
        if (path === '/' || path === '') {
            event.preventDefault();
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
    }
}