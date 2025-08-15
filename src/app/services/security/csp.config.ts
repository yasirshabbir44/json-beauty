/**
 * Content Security Policy configuration
 * This file defines the CSP directives for the application
 */
export class CSPConfig {
    /**
     * Get the CSP directives as a string
     * @returns CSP directives string
     */
    public static getCSPDirectives(): string {
        return [
            // Default policy for all content types
            "default-src 'self'",
            
            // Script sources
            "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
            
            // Style sources
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            
            // Font sources
            "font-src 'self' https://fonts.gstatic.com",
            
            // Image sources
            "img-src 'self' data: https:",
            
            // Connect sources (for API calls, WebSockets)
            "connect-src 'self'",
            
            // Frame sources
            "frame-src 'self'",
            
            // Object sources (plugins)
            "object-src 'none'",
            
            // Media sources
            "media-src 'self'",
            
            // Worker sources
            "worker-src 'self' blob:",
            
            // Manifest sources
            "manifest-src 'self'",
            
            // Base URI restriction
            "base-uri 'self'",
            
            // Form action restriction
            "form-action 'self'",
            
            // Frame ancestors restriction (prevents clickjacking)
            "frame-ancestors 'self'",
            
            // Block mixed content
            "block-all-mixed-content",
            
            // Upgrade insecure requests
            "upgrade-insecure-requests"
        ].join('; ');
    }

    /**
     * Get the CSP meta tag content
     * @returns CSP meta tag content
     */
    public static getCSPMetaTag(): string {
        return this.getCSPDirectives();
    }

    /**
     * Get the CSP header value
     * @returns CSP header value
     */
    public static getCSPHeader(): string {
        return this.getCSPDirectives();
    }
}