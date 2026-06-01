import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
    selector: 'app-pwa-ios-install-dialog',
    templateUrl: './pwa-ios-install-dialog.component.html',
    styleUrls: ['./pwa-ios-install-dialog.component.scss'],
    standalone: false
})
export class PwaIosInstallDialogComponent {
    constructor(private readonly dialogRef: MatDialogRef<PwaIosInstallDialogComponent>) {}

    close(): void {
        this.dialogRef.close();
    }
}
