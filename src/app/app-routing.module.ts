import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {JsonEditorComponent} from './components/json-editor/json-editor.component';

const routes: Routes = [
    // Default route redirects to the main page
    {path: '', redirectTo: '/editor', pathMatch: 'full'},
    // Main editor route
    {path: 'editor', component: JsonEditorComponent},
    // Fallback route for any undefined routes
    {path: '**', redirectTo: '/editor'}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule {
}
