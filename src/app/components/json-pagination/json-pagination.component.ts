import { Component, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { LazyJsonParserService } from '../../services/parsing/lazy-json-parser.service';

/**
 * Component for displaying paginated JSON arrays
 * This component handles large JSON arrays by displaying them in pages
 * to improve performance and reduce memory usage
 */
@Component({
  selector: 'app-json-pagination',
  templateUrl: './json-pagination.component.html',
  styleUrls: ['./json-pagination.component.scss']
})
export class JsonPaginationComponent implements OnChanges {
  @Input() jsonArray: any[] = [];
  @Input() pageSize: number = 100;
  @Output() pageChange = new EventEmitter<number>();

  currentPage: number = 0;
  totalPages: number = 0;
  totalItems: number = 0;
  displayedItems: any[] = [];
  pageSizeOptions: number[] = [10, 25, 50, 100, 250, 500];

  constructor(private lazyJsonParserService: LazyJsonParserService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jsonArray'] || changes['pageSize']) {
      this.updatePagination();
    }
  }

  /**
   * Updates the pagination based on the current array and page size
   */
  updatePagination(): void {
    if (!this.jsonArray || !Array.isArray(this.jsonArray)) {
      this.displayedItems = [];
      this.totalItems = 0;
      this.totalPages = 0;
      return;
    }

    const paginationResult = this.lazyJsonParserService.paginateArray(
      this.jsonArray,
      this.pageSize,
      this.currentPage
    );

    this.displayedItems = paginationResult.items;
    this.totalItems = paginationResult.totalItems;
    this.totalPages = paginationResult.totalPages;
    
    // Adjust current page if it's out of bounds
    if (this.currentPage >= this.totalPages && this.totalPages > 0) {
      this.goToPage(this.totalPages - 1);
    }
  }

  /**
   * Navigates to a specific page
   * @param pageIndex The zero-based page index to navigate to
   */
  goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.totalPages) {
      return;
    }

    this.currentPage = pageIndex;
    this.updatePagination();
    this.pageChange.emit(this.currentPage);
  }

  /**
   * Navigates to the next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  /**
   * Navigates to the previous page
   */
  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  /**
   * Navigates to the first page
   */
  firstPage(): void {
    this.goToPage(0);
  }

  /**
   * Navigates to the last page
   */
  lastPage(): void {
    this.goToPage(this.totalPages - 1);
  }

  /**
   * Changes the page size
   * @param newSize The new page size
   */
  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 0; // Reset to first page when changing page size
    this.updatePagination();
  }

  /**
   * Gets the range of items currently displayed
   * @returns A string representing the range (e.g., "1-100 of 500")
   */
  getDisplayedRange(): string {
    if (this.totalItems === 0) {
      return '0-0 of 0';
    }

    const start = this.currentPage * this.pageSize + 1;
    const end = Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
    return `${start}-${end} of ${this.totalItems}`;
  }

  /**
   * Checks if the item is expandable (object or array)
   * @param item The item to check
   * @returns True if the item is an object or array
   */
  isExpandable(item: any): boolean {
    return item !== null && typeof item === 'object';
  }

  /**
   * Gets the type of an item
   * @param item The item to check
   * @returns The type of the item as a string
   */
  getItemType(item: any): string {
    if (item === null) return 'null';
    if (Array.isArray(item)) return 'array';
    return typeof item;
  }

  /**
   * Formats a value for display
   * @param value The value to format
   * @returns The formatted value as a string
   */
  formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      return `Object(${Object.keys(value).length} properties)`;
    }
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  }
}