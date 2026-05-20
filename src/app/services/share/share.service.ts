import {Injectable} from '@angular/core';

export type ShareCompressionMode = 'auto' | 'on' | 'off';

export interface ShareUrlResult {
    url: string;
    compressed: boolean;
    compressionSupported: boolean;
}

export interface ShareUrlStats {
    length: number;
    warning: string | null;
    humanSize: string;
}

export interface SocialShareLink {
    id: string;
    label: string;
    icon: string;
    href: string;
}

/** Browser URL length guidance (many clients truncate around 2k). */
const URL_LENGTH_WARN = 2000;
const URL_LENGTH_CRITICAL = 8000;

@Injectable({
    providedIn: 'root'
})
export class ShareService {
    private readonly jsonParam = 'json';
    private readonly compressedParam = 'jc';

    supportsCompression(): boolean {
        return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
    }

    /**
     * Builds a shareable URL for minified JSON. Uses gzip+base64 (`jc`) when shorter or when the raw URL is long.
     */
    async buildShareUrl(
        minifiedJson: string,
        baseHref: string = window.location.href,
        mode: ShareCompressionMode = 'auto'
    ): Promise<ShareUrlResult> {
        const base = new URL(baseHref);
        base.searchParams.delete(this.jsonParam);
        base.searchParams.delete(this.compressedParam);

        const uncompressed = this.buildUrlWithParam(base, this.jsonParam, encodeURIComponent(minifiedJson));
        const compressionSupported = this.supportsCompression();

        if (!compressionSupported || mode === 'off') {
            return {url: uncompressed, compressed: false, compressionSupported};
        }

        const compressedPayload = await this.compress(minifiedJson);
        const compressed = this.buildUrlWithParam(base, this.compressedParam, compressedPayload);

        if (mode === 'on') {
            return {url: compressed, compressed: true, compressionSupported};
        }

        const useCompressed =
            compressed.length < uncompressed.length ||
            uncompressed.length >= URL_LENGTH_WARN;

        return {
            url: useCompressed ? compressed : uncompressed,
            compressed: useCompressed,
            compressionSupported
        };
    }

    /**
     * Reads shared JSON from the current page query string (`json` or `jc`).
     */
    async extractJsonFromSearchParams(params: URLSearchParams): Promise<string | null> {
        const compressed = params.get(this.compressedParam);
        if (compressed) {
            if (!this.supportsCompression()) {
                throw new Error('This browser cannot open compressed share links. Try a modern browser.');
            }
            return this.decompress(compressed);
        }

        const raw = params.get(this.jsonParam);
        return raw ? decodeURIComponent(raw) : null;
    }

    getUrlStats(url: string): ShareUrlStats {
        const length = url.length;
        let warning: string | null = null;

        if (length >= URL_LENGTH_CRITICAL) {
            warning = 'This link is very long and may not work in some apps or browsers.';
        } else if (length >= URL_LENGTH_WARN) {
            warning = 'Long links can fail in email or chat apps. Prefer Copy Link or Download.';
        }

        return {
            length,
            warning,
            humanSize: this.formatByteSize(new Blob([url]).size)
        };
    }

    getSocialShareLinks(shareUrl: string, title = 'JSON shared via JSON Beauty'): SocialShareLink[] {
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(title);
        const tweetText = encodeURIComponent(`${title} `);

        return [
            {
                id: 'email',
                label: 'Email',
                icon: 'email',
                href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`
            },
            {
                id: 'twitter',
                label: 'X',
                icon: 'tag',
                href: `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`
            },
            {
                id: 'linkedin',
                label: 'LinkedIn',
                icon: 'work',
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
            },
            {
                id: 'whatsapp',
                label: 'WhatsApp',
                icon: 'chat',
                href: `https://wa.me/?text=${encodedUrl}`
            },
            {
                id: 'telegram',
                label: 'Telegram',
                icon: 'send',
                href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
            },
            {
                id: 'reddit',
                label: 'Reddit',
                icon: 'forum',
                href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
            }
        ];
    }

    getMarkdownLink(shareUrl: string, label = 'Open shared JSON'): string {
        return `[${label}](${shareUrl})`;
    }

    getEmbedHtml(shareUrl: string): string {
        return `<a href="${shareUrl}" target="_blank" rel="noopener noreferrer">Open shared JSON</a>`;
    }

    canUseNativeShare(): boolean {
        return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    }

    async nativeShare(shareUrl: string, title = 'JSON Beauty'): Promise<void> {
        if (!this.canUseNativeShare()) {
            throw new Error('Native sharing is not supported on this device');
        }
        await navigator.share({
            title,
            text: 'Shared JSON document',
            url: shareUrl
        });
    }

    downloadJsonFile(jsonContent: string, filename = 'shared.json'): void {
        const blob = new Blob([jsonContent], {type: 'application/json;charset=utf-8'});
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(objectUrl);
    }

    getQrCodeUrl(shareUrl: string, size = 160): string {
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(shareUrl)}`;
    }

    private buildUrlWithParam(base: URL, key: string, value: string): string {
        const url = new URL(base.toString());
        url.searchParams.set(key, value);
        return url.toString();
    }

    private async compress(text: string): Promise<string> {
        const input = new TextEncoder().encode(text);
        const stream = new Blob([input]).stream().pipeThrough(new CompressionStream('gzip'));
        const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
        return this.uint8ToBase64url(compressed);
    }

    private async decompress(base64url: string): Promise<string> {
        const bytes = this.base64urlToUint8(base64url);
        const stream = new Blob([new Uint8Array(bytes)]).stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressed = await new Response(stream).arrayBuffer();
        return new TextDecoder().decode(decompressed);
    }

    private uint8ToBase64url(bytes: Uint8Array): string {
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    private base64urlToUint8(base64url: string): Uint8Array {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const pad = base64.length % 4;
        if (pad) {
            base64 += '='.repeat(4 - pad);
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    private formatByteSize(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
