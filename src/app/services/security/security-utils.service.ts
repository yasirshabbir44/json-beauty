import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service providing security utilities for protection against common web vulnerabilities
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityUtilsService {
  // CSRF token key in localStorage
  private readonly CSRF_TOKEN_KEY = 'X-CSRF-TOKEN';

  constructor(private http: HttpClient) { }

  /**
   * Generate a random CSRF token
   * @returns Random string to use as CSRF token
   */
  private generateCSRFToken(): string {
    const randomValues = new Uint8Array(16);
    window.crypto.getRandomValues(randomValues);
    return Array.from(randomValues)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Initialize CSRF protection
   * Generates and stores a CSRF token if one doesn't exist
   */
  public initializeCSRFProtection(): void {
    if (!this.getCSRFToken()) {
      const token = this.generateCSRFToken();
      this.setCSRFToken(token);
    }
  }

  /**
   * Get the current CSRF token
   * @returns The current CSRF token or null if not set
   */
  public getCSRFToken(): string | null {
    return localStorage.getItem(this.CSRF_TOKEN_KEY);
  }

  /**
   * Set the CSRF token
   * @param token The token to set
   */
  private setCSRFToken(token: string): void {
    localStorage.setItem(this.CSRF_TOKEN_KEY, token);
  }

  /**
   * Get HTTP headers with CSRF token
   * @returns HttpHeaders with CSRF token
   */
  public getCSRFHeaders(): HttpHeaders {
    const token = this.getCSRFToken();
    return new HttpHeaders({
      'X-CSRF-TOKEN': token || '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * Validate a file before processing
   * @param file The file to validate
   * @param allowedTypes Array of allowed MIME types
   * @param maxSizeInBytes Maximum file size in bytes
   * @returns True if file is valid, false otherwise
   */
  public validateFile(file: File, allowedTypes: string[], maxSizeInBytes: number): boolean {
    // Check file size
    if (file.size > maxSizeInBytes) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSizeInBytes} bytes)`);
      return false;
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type} (allowed: ${allowedTypes.join(', ')})`);
      return false;
    }

    return true;
  }

  /**
   * Validate a URL for security
   * @param url The URL to validate
   * @returns True if URL is valid and safe, false otherwise
   */
  public validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Check for dangerous protocols
      const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
      if (dangerousProtocols.some(protocol => parsedUrl.protocol.startsWith(protocol))) {
        console.error(`Dangerous URL protocol detected: ${parsedUrl.protocol}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Invalid URL: ${url}`);
      return false;
    }
  }

  /**
   * Secure HTTP request with CSRF protection
   * @param url The URL to request
   * @param method The HTTP method
   * @param body The request body (for POST, PUT, etc.)
   * @returns Observable of the HTTP response
   */
  public secureRequest<T>(url: string, method: string, body?: any): Observable<T> {
    const headers = this.getCSRFHeaders();
    
    switch (method.toUpperCase()) {
      case 'GET':
        return this.http.get<T>(url, { headers });
      case 'POST':
        return this.http.post<T>(url, body, { headers });
      case 'PUT':
        return this.http.put<T>(url, body, { headers });
      case 'DELETE':
        return this.http.delete<T>(url, { headers });
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}