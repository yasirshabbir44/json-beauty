import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-json-visualization',
  templateUrl: './json-visualization.component.html',
  styleUrls: ['./json-visualization.component.scss']
})
export class JsonVisualizationComponent implements OnInit, OnChanges {
  @Input() jsonData: any;
  
  // Visualization properties
  visualizationData: any = null;
  expandedNodes: Set<string> = new Set<string>();
  
  constructor() { }

  ngOnInit(): void {
    this.initializeVisualization();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jsonData']) {
      this.initializeVisualization();
    }
  }

  /**
   * Initializes the JSON visualization
   */
  initializeVisualization(): void {
    if (this.jsonData) {
      try {
        // If jsonData is a string, parse it
        if (typeof this.jsonData === 'string') {
          this.visualizationData = JSON.parse(this.jsonData);
        } else {
          this.visualizationData = this.jsonData;
        }
        
        // Expand the root node by default
        this.expandedNodes.add('root');
      } catch (error) {
        console.error('Error initializing visualization:', error);
        this.visualizationData = null;
      }
    }
  }

  /**
   * Gets the keys of an object
   * @param obj The object to get keys from
   * @returns Array of keys
   */
  getObjectKeys(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj);
  }

  /**
   * Checks if a value is expandable (object or array)
   * @param value The value to check
   * @returns True if the value is expandable
   */
  isExpandable(value: any): boolean {
    return (this.isObject(value) || this.isArray(value)) &&
      (this.isArray(value) ? value.length > 0 : Object.keys(value).length > 0);
  }

  /**
   * Toggles a node's expanded state
   * @param nodeId The ID of the node to toggle
   */
  toggleNode(nodeId: string): void {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
  }

  /**
   * Checks if a node is expanded
   * @param nodeId The ID of the node to check
   * @returns True if the node is expanded
   */
  isNodeExpanded(nodeId: string): boolean {
    return this.expandedNodes.has(nodeId);
  }

  /**
   * Checks if a value is a string
   * @param value The value to check
   * @returns True if the value is a string
   */
  isString(value: any): boolean {
    return typeof value === 'string';
  }

  /**
   * Checks if a value is a number
   * @param value The value to check
   * @returns True if the value is a number
   */
  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  /**
   * Checks if a value is a boolean
   * @param value The value to check
   * @returns True if the value is a boolean
   */
  isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  /**
   * Checks if a value is an array
   * @param value The value to check
   * @returns True if the value is an array
   */
  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * Checks if a value is an object
   * @param value The value to check
   * @returns True if the value is an object
   */
  isObject(value: any): boolean {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  /**
   * Formats a value for display
   * @param value The value to format
   * @returns Formatted value as a string
   */
  formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (this.isString(value)) return `"${value}"`;
    return String(value);
  }
}