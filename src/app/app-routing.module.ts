import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
    // Default route redirects to the main page
    {path: '', redirectTo: '/editor', pathMatch: 'full'},
    // Lazy loaded feature modules
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
