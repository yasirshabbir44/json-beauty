import { Component, Input } from '@angular/core';

/**
 * Progressive loading indicator component
 * This component displays a loading indicator with progress information
 * for long-running operations like parsing large JSON documents
 */
@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss']
})
export class LoadingIndicatorComponent {
  @Input() isLoading: boolean = false;
  @Input() progress: number = 0;
  @Input() message: string = 'Loading...';
  @Input() showProgressBar: boolean = true;
  @Input() showSpinner: boolean = true;
  @Input() overlay: boolean = false;
  
  /**
   * Gets the formatted progress percentage
   * @returns The progress as a percentage string
   */
  get progressPercentage(): string {
    return `${Math.round(this.progress)}%`;
  }
  
  /**
   * Determines if progress information should be shown
   * @returns True if progress information should be shown
   */
  get showProgress(): boolean {
    return this.showProgressBar && this.progress > 0;
  }
}