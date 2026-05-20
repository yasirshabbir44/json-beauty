import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
    // Root loads the editor so shared `?json=` / `?jc=` links are not stripped by redirects
    {
        path: '',
        loadChildren: () => import('./modules/editor/editor.module').then(m => m.EditorModule)
    },
    {
        path: 'editor',
        loadChildren: () => import('./modules/editor/editor.module').then(m => m.EditorModule)
    },
    {
        path: 'conversion',
        loadChildren: () => import('./modules/conversion/conversion.module').then(m => m.ConversionModule)
    },
    {
        path: 'validation',
        loadChildren: () => import('./modules/validation/validation.module').then(m => m.ValidationModule)
    },
    // Fallback route for any undefined routes
    {path: '**', redirectTo: '/editor'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
