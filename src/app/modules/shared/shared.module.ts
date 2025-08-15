import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';

// Components
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { JsonDialogsComponent } from '../../components/json-dialogs/json-dialogs.component';
import { SearchReplaceComponent } from '../../components/search-replace/search-replace.component';

// Services
import { ErrorHandlingService } from '../../services/error-handling.service';
import { ConfigurationService } from '../../services/configuration.service';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    SearchReplaceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    // Angular Material
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule
  ],
  providers: [
    ErrorHandlingService,
    ConfigurationService
  ],
  exports: [
    // Common modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    
    // Angular Material modules
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    
    // Components
    HeaderComponent,
    FooterComponent,
    SearchReplaceComponent
  ]
})
export class SharedModule { }