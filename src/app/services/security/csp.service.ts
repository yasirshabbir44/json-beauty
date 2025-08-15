import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CSPConfig } from './csp.config';

/**
 * Service responsible for applying Content Security Policy
 */
@Injectable({
  providedIn: 'root'
})
export class CSPService {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Initialize CSP for the application
   * This should be called in app.component.ts during initialization
   */
  public initializeCSP(): void {
    if (!this.isBrowser) {
      return; // Skip if not running in browser
    }

    this.applyCSPMetaTag();
  }

  /**
   * Apply CSP via meta tag
   * This is the client-side approach for applying CSP
   */
  private applyCSPMetaTag(): void {
    try {
      // Create meta tag for CSP
      const metaTag = document.createElement('meta');
      metaTag.httpEquiv = 'Content-Security-Policy';
      metaTag.content = CSPConfig.getCSPMetaTag();

      // Add meta tag to head
      document.head.appendChild(metaTag);
      
      console.info('Content Security Policy applied via meta tag');
    } catch (error) {
      console.error('Failed to apply Content Security Policy:', error);
    }
  }

  /**
   * Get CSP header value for server-side implementation
   * This can be used in server middleware to set CSP headers
   * @returns CSP header value
   */
  public getCSPHeaderValue(): string {
    return CSPConfig.getCSPHeader();
  }

  /**
   * Report CSP violations
   * This method can be expanded to send violations to a reporting endpoint
   * @param violation The CSP violation event
   */
  public reportViolation(violation: SecurityPolicyViolationEvent): void {
    console.warn('CSP Violation:', {
      blockedURI: violation.blockedURI,
      violatedDirective: violation.violatedDirective,
      effectiveDirective: violation.effectiveDirective,
      disposition: violation.disposition,
      documentURI: violation.documentURI,
      originalPolicy: violation.originalPolicy,
      sourceFile: violation.sourceFile,
      lineNumber: violation.lineNumber,
      columnNumber: violation.columnNumber
    });
    
    // In a production environment, you would send this data to a reporting endpoint
    // this.http.post('/api/csp-report', violation).subscribe();
  }

  /**
   * Add event listener for CSP violations
   * This should be called after CSP is initialized
   */
  public listenForViolations(): void {
    if (!this.isBrowser) {
      return;
    }

    document.addEventListener('securitypolicyviolation', (e: SecurityPolicyViolationEvent) => {
      this.reportViolation(e);
    });
  }
}