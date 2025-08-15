declare module 'xml2js' {
    /**
     * Options for XML parsing
     */
    export interface ParserOptions {
        explicitArray?: boolean;

        [key: string]: any;
    }

    /**
     * Options for XML building
     */
    export interface BuilderOptions {
        renderOpts?: {
            pretty?: boolean;
            indent?: string;
        };
        headless?: boolean;

        [key: string]: any;
    }

    /**
     * Parse XML string to JavaScript object
     */
    export function parseString(
        xml: string,
        callback: (err: Error | null, result: any) => void
    ): void;

    export function parseString(
        xml: string,
        options: ParserOptions,
        callback: (err: Error | null, result: any) => void
    ): void;

    /**
     * Builder class for converting JavaScript objects to XML
     */
    export class Builder {
        constructor(options?: BuilderOptions);

        buildObject(obj: any): string;
    }
}