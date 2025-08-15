import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { JsonService } from '../../services/json.service';

@Component({
  selector: 'app-json-comparison',
  templateUrl: './json-comparison.component.html',
  styleUrls: ['./json-comparison.component.scss']
})
export class JsonComparisonComponent implements OnInit {
  @Input() jsonData: any;
  @Input() compareJsonInput: FormControl = new FormControl('');
  @Input() jsonDiffResult: { delta: any, htmlDiff: string, hasChanges: boolean } | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() compareComplete = new EventEmitter<{ delta: any, htmlDiff: string, hasChanges: boolean }>();
  
  constructor(private jsonService: JsonService) { }

  ngOnInit(): void {
    // Initialize with empty form control if not provided
    if (!this.compareJsonInput) {
      this.compareJsonInput = new FormControl('');
    }
  }

  /**
   * Compares the JSON documents
   */
  compareJson(): void {
    try {
      if (!this.jsonData) {
        throw new Error('No JSON data to compare');
      }

      // Get the JSON data to compare against
      const compareData = this.compareJsonInput.value;
      if (!compareData) {
        throw new Error('Please enter JSON to compare');
      }

      // Compare the JSON documents
      const result = this.jsonService.compareJson(
        typeof this.jsonData === 'string' ? this.jsonData : JSON.stringify(this.jsonData),
        compareData
      );

      // Emit the result
      this.compareComplete.emit(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error comparing JSON: ${errorMessage}`);
      
      // Emit undefined on error instead of null to match the expected type
      this.compareComplete.emit(undefined);
    }
  }

  /**
   * Closes the comparison dialog
   */
  closeDialog(): void {
    this.close.emit();
  }
}