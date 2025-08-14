import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ClipboardModule } from '@angular/cdk/clipboard';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

// App Components
import { AppComponent } from './app.component';
import { JsonEditorComponent } from './components/json-editor/json-editor.component';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { JsonToolbarComponent } from './components/json-toolbar/json-toolbar.component';
import { JsonInputEditorComponent } from './components/json-input-editor/json-input-editor.component';
import { JsonOutputEditorComponent } from './components/json-output-editor/json-output-editor.component';
import { JsonDialogsComponent } from './components/json-dialogs/json-dialogs.component';
import { JsonStatusComponent } from './components/json-status/json-status.component';
import { JsonPathsComponent } from './components/json-paths/json-paths.component';
import { SearchReplaceComponent } from './components/search-replace/search-replace.component';
import { VersionHistoryComponent } from './components/version-history/version-history.component';
import { ShareDialogComponent } from './components/share-dialog/share-dialog.component';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Custom Modules
import { ConvertersModule } from './services/conversion/converters/converters.module';

@NgModule({
  declarations: [
    AppComponent,
    JsonEditorComponent,
    HeaderComponent,
    FooterComponent,
    JsonToolbarComponent,
    JsonInputEditorComponent,
    JsonOutputEditorComponent,
    JsonDialogsComponent,
    JsonStatusComponent,
    JsonPathsComponent,
    SearchReplaceComponent,
    VersionHistoryComponent,
    ShareDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    ClipboardModule,
    AppRoutingModule,
    ConvertersModule,
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatTabsModule,
    MatDividerModule,
    MatExpansionModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatCheckboxModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
