import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { InputSanitizationService } from './input-sanitization.service';
import { CSPService } from './csp.service';
import { SecurityUtilsService } from './security-utils.service';

/**
 * Security module that provides all security-related services
 */
@NgModule({ declarations: [], imports: [CommonModule], providers: [
        InputSanitizationService,
        CSPService,
        SecurityUtilsService,
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class SecurityModule { }