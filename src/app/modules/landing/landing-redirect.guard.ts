import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

/** Preserve shared `?json=` / `?jc=` links by sending them straight to the editor. */
export const landingRedirectGuard: CanActivateFn = (route) => {
    if (route.queryParamMap.has('json') || route.queryParamMap.has('jc')) {
        const router = inject(Router);
        return router.createUrlTree(['/editor'], {queryParams: route.queryParams});
    }
    return true;
};
