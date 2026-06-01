import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {SwUpdate, VersionReadyEvent} from '@angular/service-worker';
import {PwaIosInstallDialogComponent} from '../../components/pwa-ios-install-dialog/pwa-ios-install-dialog.component';
import {BehaviorSubject, fromEvent, map, merge, Observable, of} from 'rxjs';
import {filter} from 'rxjs/operators';

const BANNER_DISMISSED_KEY = 'json-beauty-pwa-banner-dismissed';

/** Chromium `beforeinstallprompt` event (not in lib.dom). */
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<void>;
}

export type InstallResult = 'accepted' | 'dismissed' | 'unavailable';

@Injectable({providedIn: 'root'})
export class PwaService {
    private readonly swUpdate = inject(SwUpdate);
    private readonly snackBar = inject(MatSnackBar);
    private readonly dialog = inject(MatDialog);
    private readonly installPrompt$ = new BehaviorSubject<BeforeInstallPromptEvent | null>(null);
    private readonly bannerDismissed$ = new BehaviorSubject(this.readBannerDismissed());

    readonly canInstall$: Observable<boolean> = this.installPrompt$.pipe(map((e) => e != null));

    readonly isOnline$: Observable<boolean> = merge(
        of(typeof navigator !== 'undefined' ? navigator.onLine : true),
        fromEvent(window, 'online').pipe(map(() => true)),
        fromEvent(window, 'offline').pipe(map(() => false))
    );

    /** True when the app runs as an installed PWA or was added to the home screen. */
    readonly isInstalled$ = of(this.isStandalone());

    /** Whether the install control should appear in the header (not when already installed). */
    readonly showInstallButton$: Observable<boolean> = this.isInstalled$.pipe(
        map((installed) => !installed)
    );

    constructor() {
        if (typeof window === 'undefined') {
            return;
        }
        window.addEventListener('beforeinstallprompt', (event: Event) => {
            event.preventDefault();
            this.installPrompt$.next(event as BeforeInstallPromptEvent);
        });
        window.addEventListener('appinstalled', () => {
            this.installPrompt$.next(null);
            this.bannerDismissed$.next(true);
        });
    }

    init(): void {
        this.listenForUpdates();
    }

    isStandalone(): boolean {
        if (typeof window === 'undefined') {
            return false;
        }
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: minimal-ui)').matches ||
            (window.navigator as Navigator & {standalone?: boolean}).standalone === true
        );
    }

    isIosInstallable(): boolean {
        if (typeof navigator === 'undefined' || this.isStandalone()) {
            return false;
        }
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & {MSStream?: unknown}).MSStream;
    }

    dismissInstallBanner(): void {
        try {
            localStorage.setItem(BANNER_DISMISSED_KEY, '1');
        } catch {
            /* ignore */
        }
        this.bannerDismissed$.next(true);
    }

    resetInstallBanner(): void {
        try {
            localStorage.removeItem(BANNER_DISMISSED_KEY);
        } catch {
            /* ignore */
        }
        this.bannerDismissed$.next(false);
    }

    openInstallFlow(): void {
        if (this.isIosInstallable()) {
            this.dialog.open(PwaIosInstallDialogComponent, {
                width: 'min(420px, calc(100vw - 2rem))',
                autoFocus: true
            });
            return;
        }
        void this.promptInstall().then((outcome) => this.notifyInstallOutcome(outcome));
    }

    async promptInstall(): Promise<InstallResult> {
        const event = this.installPrompt$.value;
        if (!event) {
            return 'unavailable';
        }
        await event.prompt();
        const {outcome} = await event.userChoice;
        if (outcome === 'accepted') {
            this.installPrompt$.next(null);
        }
        return outcome;
    }

    private notifyInstallOutcome(outcome: InstallResult): void {
        if (outcome === 'accepted') {
            this.snackBar.open('JSON Beauty installed — you can use it offline.', 'OK', {duration: 5000});
        } else if (outcome === 'unavailable') {
            this.snackBar.open(
                'Install from your browser menu (e.g. Install app or Add to Home screen).',
                'OK',
                {duration: 6000}
            );
        }
    }

    private readBannerDismissed(): boolean {
        try {
            return localStorage.getItem(BANNER_DISMISSED_KEY) === '1';
        } catch {
            return false;
        }
    }

    private listenForUpdates(): void {
        if (!this.swUpdate.isEnabled) {
            return;
        }
        this.swUpdate.versionUpdates
            .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
            .subscribe(() => {
                const ref = this.snackBar.open('A new version is available.', 'Reload', {
                    duration: 0,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom'
                });
                ref.onAction().subscribe(() => {
                    void this.swUpdate.activateUpdate().then(() => document.location.reload());
                });
            });
    }
}
