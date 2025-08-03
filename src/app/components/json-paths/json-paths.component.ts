import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-json-paths',
  templateUrl: './json-paths.component.html',
  styleUrls: ['./json-paths.component.scss']
})
export class JsonPathsComponent {
  @Input() showJsonPaths: boolean = false;
  @Input() isValidJson: boolean = true;
  @Input() jsonPaths: string[] = [];
  
  @Output() toggleJsonPaths = new EventEmitter<void>();
  
  constructor() { }
  
  /**
   * Closes the JSON paths section
   */
  closeJsonPaths(): void {
    this.toggleJsonPaths.emit();
  }
}