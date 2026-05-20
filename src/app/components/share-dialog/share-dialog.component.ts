import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {
    ShareCompressionMode,
    ShareService,
    ShareUrlStats,
    SocialShareLink
} from '../../services/share/share.service';

export interface ShareDialogData {
    shareableUrl: string;
    jsonContent: string;
    compressed: boolean;
    compressionSupported: boolean;
}

@Component({
    selector: 'app-share-dialog',
    templateUrl: './share-dialog.component.html',
    styleUrls: ['./share-dialog.component.scss'],
    standalone: false
})
export class ShareDialogComponent {
    @ViewChild('urlInput') urlInput?: ElementRef<HTMLInputElement>;

    shareableUrl: string;
    compressed: boolean;
    urlStats!: ShareUrlStats;
    socialLinks: SocialShareLink[] = [];
    markdownLink = '';
    embedHtml = '';
    isRebuildingUrl = false;
    copyLinkLabel = 'Copy Link';

    readonly compressionSupported: boolean;

    constructor(
        public dialogRef: MatDialogRef<ShareDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ShareDialogData,
        private snackBar: MatSnackBar,
        private shareService: ShareService
    ) {
        this.shareableUrl = data.shareableUrl;
        this.compressed = data.compressed;
        this.compressionSupported = data.compressionSupported;
        this.refreshDerivedState();
    }

    get canNativeShare(): boolean {
        return this.shareService.canUseNativeShare();
    }

    get compressToggleLabel(): string {
        if (!this.compressionSupported) {
            return 'Compression unavailable in this browser';
        }
        return this.compressed ? 'Using compressed link (shorter URL)' : 'Using full JSON in URL';
    }

    encodeURIComponent(str: string): string {
        return window.encodeURIComponent(str);
    }

    get qrCodeSrc(): string {
        return this.shareService.getQrCodeUrl(this.shareableUrl);
    }

    async onCompressionToggle(enabled: boolean): Promise<void> {
        if (!this.compressionSupported || this.isRebuildingUrl) {
            return;
        }

        this.isRebuildingUrl = true;
        try {
            const mode: ShareCompressionMode = enabled ? 'on' : 'off';
            const result = await this.shareService.buildShareUrl(this.data.jsonContent, window.location.href, mode);
            this.shareableUrl = result.url;
            this.compressed = result.compressed;
            window.history.replaceState({}, '', this.shareableUrl);
            this.refreshDerivedState();
        } catch (err) {
            this.showError('Failed to update link: ' + this.toMessage(err));
        } finally {
            this.isRebuildingUrl = false;
        }
    }

    copyUrl(): void {
        this.copyText(this.shareableUrl, 'Link copied to clipboard');
    }

    copyJson(): void {
        this.copyText(this.data.jsonContent, 'JSON copied to clipboard');
    }

    copyMarkdown(): void {
        this.copyText(this.markdownLink, 'Markdown link copied');
    }

    copyEmbed(): void {
        this.copyText(this.embedHtml, 'Embed HTML copied');
    }

    async nativeShare(): Promise<void> {
        try {
            await this.shareService.nativeShare(this.shareableUrl);
        } catch (err) {
            if (this.isShareCancelled(err)) {
                return;
            }
            this.showError('Share failed: ' + this.toMessage(err));
        }
    }

    downloadJson(): void {
        this.shareService.downloadJsonFile(this.data.jsonContent);
        this.showSuccess('JSON file downloaded');
    }

    openInNewTab(): void {
        window.open(this.shareableUrl, '_blank', 'noopener,noreferrer');
    }

    selectUrl(): void {
        this.urlInput?.nativeElement?.select();
    }

    close(): void {
        this.dialogRef.close();
    }

    private refreshDerivedState(): void {
        this.urlStats = this.shareService.getUrlStats(this.shareableUrl);
        this.socialLinks = this.shareService.getSocialShareLinks(this.shareableUrl);
        this.markdownLink = this.shareService.getMarkdownLink(this.shareableUrl);
        this.embedHtml = this.shareService.getEmbedHtml(this.shareableUrl);
    }

    private copyText(text: string, successMessage: string): void {
        void navigator.clipboard.writeText(text)
            .then(() => {
                if (successMessage.includes('Link')) {
                    this.copyLinkLabel = 'Copied!';
                    setTimeout(() => (this.copyLinkLabel = 'Copy Link'), 2000);
                }
                this.showSuccess(successMessage);
            })
            .catch(err => this.showError('Failed to copy: ' + this.toMessage(err)));
    }

    private isShareCancelled(err: unknown): boolean {
        return err instanceof DOMException && err.name === 'AbortError';
    }

    private toMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err);
    }

    private showSuccess(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 3000,
            panelClass: 'success-snackbar'
        });
    }

    private showError(message: string): void {
        this.snackBar.open(message, 'Dismiss', {
            duration: 5000,
            panelClass: 'error-snackbar'
        });
    }
}
