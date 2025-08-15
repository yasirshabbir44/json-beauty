import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { InputSanitizationService } from './input-sanitization.service';
import { CSPService } from './csp.service';
import { SecurityUtilsService } from './security-utils.service';

/**
 * Security module that provides all security-related services
 */
@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    InputSanitizationService,
    CSPService,
    SecurityUtilsService
  ]
})
export class SecurityModule { }