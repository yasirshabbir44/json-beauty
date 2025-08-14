import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SearchReplaceService } from '../../services/search/search-replace.service';

@Component({
  selector: 'app-search-replace',
  templateUrl: './search-replace.component.html',
  styleUrls: ['./search-replace.component.scss']
})
export class SearchReplaceComponent {
  @Input() text: string = '';
  @Output() textChanged = new EventEmitter<string>();
  
  searchForm: FormGroup;
  searchResults: { index: number, length: number, match: string }[] = [];
  currentResultIndex: number = -1;
  totalReplacements: number = 0;
  
  constructor(
    private fb: FormBuilder,
    private searchReplaceService: SearchReplaceService
  ) {
    this.searchForm = this.fb.group({
      searchPattern: [''],
      replacePattern: [''],
      isRegex: [false],
      isCaseSensitive: [false],
      isWholeWord: [false]
    });
  }
  
  /**
   * Searches for the pattern in the text
   */
  search(): void {
    const { searchPattern, isRegex, isCaseSensitive, isWholeWord } = this.searchForm.value;
    
    if (!searchPattern || !this.text) {
      this.searchResults = [];
      this.currentResultIndex = -1;
      return;
    }
    
    let pattern = searchPattern;
    
    // If whole word is enabled and we're using regex, add word boundary markers
    if (isWholeWord && !isRegex) {
      pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
    }
    
    this.searchResults = this.searchReplaceService.search(
      this.text,
      pattern,
      isRegex || isWholeWord,
      isCaseSensitive
    );
    
    this.currentResultIndex = this.searchResults.length > 0 ? 0 : -1;
    
    // Emit an event to highlight the current result
    if (this.currentResultIndex >= 0) {
      this.highlightCurrentResult();
    }
  }
  
  /**
   * Navigates to the next search result
   */
  findNext(): void {
    if (this.searchResults.length === 0) {
      this.search();
      return;
    }
    
    if (this.currentResultIndex < this.searchResults.length - 1) {
      this.currentResultIndex++;
    } else {
      this.currentResultIndex = 0; // Wrap around to the first result
    }
    
    this.highlightCurrentResult();
  }
  
  /**
   * Navigates to the previous search result
   */
  findPrevious(): void {
    if (this.searchResults.length === 0) {
      this.search();
      return;
    }
    
    if (this.currentResultIndex > 0) {
      this.currentResultIndex--;
    } else {
      this.currentResultIndex = this.searchResults.length - 1; // Wrap around to the last result
    }
    
    this.highlightCurrentResult();
  }
  
  /**
   * Replaces the current occurrence with the replacement pattern
   */
  replace(): void {
    if (this.searchResults.length === 0 || this.currentResultIndex === -1) {
      this.search();
      return;
    }
    
    const { searchPattern, replacePattern, isRegex, isCaseSensitive, isWholeWord } = this.searchForm.value;
    
    if (!searchPattern) {
      return;
    }
    
    let pattern = searchPattern;
    
    // If whole word is enabled and we're not using regex, add word boundary markers
    if (isWholeWord && !isRegex) {
      pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
    }
    
    // Get the current result
    const currentResult = this.searchResults[this.currentResultIndex];
    
    // Replace just this occurrence
    const before = this.text.substring(0, currentResult.index);
    const after = this.text.substring(currentResult.index + currentResult.length);
    
    // Update the text
    this.text = before + replacePattern + after;
    this.textChanged.emit(this.text);
    
    // Update search results
    this.search();
    
    this.totalReplacements++;
  }
  
  /**
   * Replaces all occurrences with the replacement pattern
   */
  replaceAll(): void {
    const { searchPattern, replacePattern, isRegex, isCaseSensitive, isWholeWord } = this.searchForm.value;
    
    if (!searchPattern || !this.text) {
      return;
    }
    
    let pattern = searchPattern;
    
    // If whole word is enabled and we're not using regex, add word boundary markers
    if (isWholeWord && !isRegex) {
      pattern = `\\b${this.escapeRegExp(pattern)}\\b`;
    }
    
    // Replace all occurrences
    const newText = this.searchReplaceService.replaceAll(
      this.text,
      pattern,
      replacePattern,
      isRegex || isWholeWord,
      isCaseSensitive
    );
    
    // Count the number of replacements
    const beforeCount = this.searchResults.length;
    
    // Update the text
    this.text = newText;
    this.textChanged.emit(this.text);
    
    // Update search results (which should now be empty)
    this.search();
    
    this.totalReplacements += beforeCount;
  }
  
  /**
   * Emits an event to highlight the current search result
   */
  private highlightCurrentResult(): void {
    if (this.currentResultIndex >= 0 && this.currentResultIndex < this.searchResults.length) {
      const result = this.searchResults[this.currentResultIndex];
      // You would implement this method in the parent component
      // to scroll to and highlight the current result
    }
  }
  
  /**
   * Escapes special regex characters in a string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}