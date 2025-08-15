import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule } from '@angular/material/paginator';

// Components
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { JsonDialogsComponent } from '../../components/json-dialogs/json-dialogs.component';
import { SearchReplaceComponent } from '../../components/search-replace/search-replace.component';
import { LoadingIndicatorComponent } from '../../components/loading-indicator/loading-indicator.component';
import { JsonPaginationComponent } from '../../components/json-pagination/json-pagination.component';
import { VirtualScrollComponent } from '../../components/virtual-scroll/virtual-scroll.component';

// Directives
import { DebounceInputDirective } from '../../directives/debounce-input.directive';

// Services
import { ErrorHandlingService } from '../../services/error-handling.service';
import { ConfigurationService } from '../../services/configuration.service';
import { LazyJsonParserService } from '../../services/parsing/lazy-json-parser.service';
import { MemoryOptimizedJsonService } from '../../services/optimization/memory-optimized-json.service';

@NgModule({
  declarations: [
    // Components
    HeaderComponent,
    FooterComponent,
    SearchReplaceComponent,
    LoadingIndicatorComponent,
    JsonPaginationComponent,
    VirtualScrollComponent,
    
    // Directives
    DebounceInputDirective
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    ScrollingModule,
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
    MatDialogModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  providers: [
    ErrorHandlingService,
    ConfigurationService,
    LazyJsonParserService,
    MemoryOptimizedJsonService
  ],
  exports: [
    // Common modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    ScrollingModule,
    
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
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    
    // Components
    HeaderComponent,
    FooterComponent,
    SearchReplaceComponent,
    LoadingIndicatorComponent,
    JsonPaginationComponent,
    VirtualScrollComponent,
    
    // Directives
    DebounceInputDirective
  ]
})
export class SharedModule { }