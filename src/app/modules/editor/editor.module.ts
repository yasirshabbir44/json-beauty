import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ClipboardModule } from '@angular/cdk/clipboard';

// Angular Material Modules
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

// Components
import { JsonEditorComponent } from '../../components/json-editor/json-editor.component';
import { JsonInputEditorComponent } from '../../components/json-input-editor/json-input-editor.component';
import { JsonOutputEditorComponent } from '../../components/json-output-editor/json-output-editor.component';
import { JsonToolbarComponent } from '../../components/json-toolbar/json-toolbar.component';
import { JsonStatusComponent } from '../../components/json-status/json-status.component';
import { JsonPathsComponent } from '../../components/json-paths/json-paths.component';
import { VersionHistoryComponent } from '../../components/version-history/version-history.component';
import { ShareDialogComponent } from '../../components/share-dialog/share-dialog.component';
import { JsonVisualizationComponent } from '../../components/json-visualization/json-visualization.component';
import { JsonComparisonComponent } from '../../components/json-comparison/json-comparison.component';
import { JsonDialogsComponent } from '../../components/json-dialogs/json-dialogs.component';

// Services
import { JsonService } from '../../services/json.service';
import { VersionHistoryService } from '../../services/history/version-history.service';

// Shared Module
import { SharedModule } from '../shared/shared.module';

// Routes
const routes: Routes = [
  { path: '', component: JsonEditorComponent }
];

@NgModule({
  declarations: [
    JsonEditorComponent,
    JsonInputEditorComponent,
    JsonOutputEditorComponent,
    JsonToolbarComponent,
    JsonStatusComponent,
    JsonPathsComponent,
    VersionHistoryComponent,
    ShareDialogComponent,
    JsonVisualizationComponent,
    JsonComparisonComponent,
    JsonDialogsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    RouterModule.forChild(routes),
    SharedModule,
    // Angular Material
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
    MatButtonToggleModule,
    MatCheckboxModule
  ],
  providers: [
    JsonService,
    VersionHistoryService
  ],
  exports: [
    JsonEditorComponent
  ]
})
export class EditorModule { }