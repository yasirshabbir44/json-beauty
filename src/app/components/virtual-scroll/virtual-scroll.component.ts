import { Component, Input, OnChanges, SimpleChanges, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

/**
 * Component for efficiently displaying large datasets using virtual scrolling
 * This component uses Angular CDK's virtual scrolling to render only the visible items
 * in a large dataset, improving performance for large JSON arrays and objects
 */
@Component({
  selector: 'app-virtual-scroll',
  templateUrl: './virtual-scroll.component.html',
  styleUrls: ['./virtual-scroll.component.scss']
})
export class VirtualScrollComponent implements OnChanges, AfterViewInit {
  // Make Array and Object available to the template
  Array = Array;
  Object = Object;
  @Input() data: any[] = [];
  @Input() itemHeight: number = 40;
  @Input() bufferSize: number = 5;
  @Input() keyField: string = '';
  @Input() valueField: string = '';
  @Input() showIndices: boolean = true;
  @Input() expandable: boolean = true;
  
  @ViewChild(CdkVirtualScrollViewport) viewport!: CdkVirtualScrollViewport;
  @ViewChild('container') container!: ElementRef;
  
  viewportHeight: number = 400;
  expandedItems: Set<number> = new Set();
  filteredData: any[] = [];
  searchText: string = '';
  
  constructor() { }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.filteredData = this.data;
      this.expandedItems.clear();
    }
  }
  
  ngAfterViewInit(): void {
    // Adjust viewport height based on container size
    if (this.container && this.container.nativeElement) {
      const containerHeight = this.container.nativeElement.clientHeight;
      if (containerHeight > 0) {
        this.viewportHeight = containerHeight;
      }
    }
  }
  
  /**
   * Toggles the expanded state of an item
   * @param index The index of the item to toggle
   */
  toggleExpand(index: number): void {
    if (this.expandedItems.has(index)) {
      this.expandedItems.delete(index);
    } else {
      this.expandedItems.add(index);
    }
  }
  
  /**
   * Checks if an item is expanded
   * @param index The index of the item to check
   * @returns True if the item is expanded
   */
  isExpanded(index: number): boolean {
    return this.expandedItems.has(index);
  }
  
  /**
   * Checks if an item is expandable (object or array)
   * @param item The item to check
   * @returns True if the item is an object or array
   */
  isItemExpandable(item: any): boolean {
    if (!this.expandable) return false;
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
    if (typeof item === 'object') return 'object';
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
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    return String(value);
  }
  
  /**
   * Gets the display value for an item
   * @param item The item to get the display value for
   * @returns The display value
   */
  getDisplayValue(item: any): string {
    if (this.valueField && typeof item === 'object' && item !== null) {
      return this.formatValue(item[this.valueField]);
    }
    return this.formatValue(item);
  }
  
  /**
   * Gets the key for an item
   * @param item The item to get the key for
   * @param index The index of the item
   * @returns The key
   */
  getKey(item: any, index: number): string {
    if (this.keyField && typeof item === 'object' && item !== null) {
      return String(item[this.keyField]);
    }
    return this.showIndices ? String(index) : '';
  }
  
  /**
   * Filters the data based on search text
   * @param text The search text
   */
  filterData(text: string): void {
    this.searchText = text;
    
    if (!text) {
      this.filteredData = this.data;
      return;
    }
    
    const searchLower = text.toLowerCase();
    this.filteredData = this.data.filter(item => {
      // Search in keys
      if (this.keyField && typeof item === 'object' && item !== null) {
        const key = String(item[this.keyField]).toLowerCase();
        if (key.includes(searchLower)) return true;
      }
      
      // Search in values
      const displayValue = this.getDisplayValue(item).toLowerCase();
      return displayValue.includes(searchLower);
    });
    
    // Scroll to top after filtering
    if (this.viewport) {
      this.viewport.scrollToIndex(0);
    }
  }
  
  /**
   * Clears the search filter
   */
  clearFilter(): void {
    this.filterData('');
  }
  
  /**
   * Gets the CSS class for an item based on its type
   * @param item The item to get the class for
   * @returns The CSS class
   */
  getItemClass(item: any): string {
    return `item-${this.getItemType(item)}`;
  }
  
  /**
   * Tracks items by index for better performance
   * @param index The index of the item
   * @returns The index
   */
  trackByIndex(index: number): number {
    return index;
  }
  
  /**
   * Expands all items
   */
  expandAll(): void {
    for (let i = 0; i < this.filteredData.length; i++) {
      if (this.isItemExpandable(this.filteredData[i])) {
        this.expandedItems.add(i);
      }
    }
  }
  
  /**
   * Collapses all items
   */
  collapseAll(): void {
    this.expandedItems.clear();
  }
}