import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LandingPageComponent} from '../../components/landing-page/landing-page.component';
import {landingRedirectGuard} from './landing-redirect.guard';

const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent,
        canActivate: [landingRedirectGuard],
    },
];

@NgModule({
    declarations: [LandingPageComponent],
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatButtonModule,
        MatIconModule,
    ],
})
export class LandingModule {}
