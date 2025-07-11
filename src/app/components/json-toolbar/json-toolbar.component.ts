import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-json-toolbar',
  templateUrl: './json-toolbar.component.html',
  styleUrls: ['./json-toolbar.component.scss']
})
export class JsonToolbarComponent {
  @Input() isValidJson: boolean = false;
  
  @Output() beautify = new EventEmitter<void>();
  @Output() minify = new EventEmitter<void>();
  @Output() lint = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() import = new EventEmitter<Event>();
  @Output() copy = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
  
  constructor() {}
  
  onImportClick(fileInput: HTMLInputElement): void {
    fileInput.click();
  }
  
  onFileSelected(event: Event): void {
    this.import.emit(event);
  }
}