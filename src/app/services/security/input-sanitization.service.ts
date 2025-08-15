import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

/**
 * Service responsible for sanitizing user inputs to prevent XSS and injection attacks
 */
@Injectable({
  providedIn: 'root'
})
export class InputSanitizationService {

  constructor(private sanitizer: DomSanitizer) { }

  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param html The HTML content to sanitize
   * @returns SafeHtml that can be used in templates
   */
  sanitizeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  /**
   * Sanitizes URLs to prevent javascript: protocol and other malicious URLs
   * @param url The URL to sanitize
   * @returns SafeUrl that can be used in templates
   */
  sanitizeUrl(url: string): SafeUrl {
    // Basic URL validation before passing to Angular sanitizer
    if (!url || typeof url !== 'string') {
      return '';
    }
    
    // Check for javascript: protocol and other potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn(`Potentially malicious URL detected: ${url}`);
        return '';
      }
    }
    
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  /**
   * Sanitizes resource URLs (like iframe src)
   * @param url The resource URL to sanitize
   * @returns SafeResourceUrl that can be used in templates
   */
  sanitizeResourceUrl(url: string): SafeResourceUrl {
    // Basic URL validation before passing to Angular sanitizer
    if (!url || typeof url !== 'string') {
      return '';
    }
    
    // Check for javascript: protocol and other potentially dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
    const lowerUrl = url.toLowerCase().trim();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn(`Potentially malicious resource URL detected: ${url}`);
        return '';
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Sanitizes JSON input to prevent injection attacks
   * @param jsonInput The JSON input to sanitize
   * @returns Sanitized JSON string
   */
  sanitizeJsonInput(jsonInput: string): string {
    if (!jsonInput || typeof jsonInput !== 'string') {
      return '';
    }
    
    try {
      // Parse and stringify to ensure valid JSON and remove any potential script injections
      const parsed = JSON.parse(jsonInput);
      return JSON.stringify(parsed);
    } catch (error) {
      // If parsing fails, return the original input (will be caught by JSON validation)
      return jsonInput;
    }
  }

  /**
   * Sanitizes file content to ensure it's valid and safe
   * @param fileContent The file content to sanitize
   * @param fileType The type of file (json, xml, etc.)
   * @returns Sanitized file content
   */
  sanitizeFileContent(fileContent: string, fileType: string): string {
    if (!fileContent || typeof fileContent !== 'string') {
      return '';
    }
    
    switch (fileType.toLowerCase()) {
      case 'json':
        return this.sanitizeJsonInput(fileContent);
      case 'xml':
        // Basic XML sanitization - more complex sanitization would be needed for production
        return fileContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      case 'yaml':
      case 'yml':
        // Basic YAML sanitization
        return fileContent.replace(/\!\!js\/function/g, '')
                         .replace(/\!\!js\/undefined/g, '')
                         .replace(/\!\!js\/regexp/g, '');
      default:
        // For unknown file types, perform basic sanitization
        return fileContent;
    }
  }

  /**
   * Sanitizes query parameters to prevent injection attacks
   * @param params The query parameters to sanitize
   * @returns Sanitized query parameters
   */
  sanitizeQueryParams(params: Record<string, string>): Record<string, string> {
    const sanitizedParams: Record<string, string> = {};
    
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        // Sanitize both keys and values
        const sanitizedKey = this.sanitizeString(key);
        const sanitizedValue = this.sanitizeString(params[key]);
        sanitizedParams[sanitizedKey] = sanitizedValue;
      }
    }
    
    return sanitizedParams;
  }

  /**
   * Basic string sanitization to prevent common injection patterns
   * @param input The string to sanitize
   * @returns Sanitized string
   */
  sanitizeString(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Replace potentially dangerous characters
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}