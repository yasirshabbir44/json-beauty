import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

interface OutlineNode {
  key: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: OutlineNode[];
  expanded?: boolean;
  line?: number;
  column?: number;
}

@Component({
  selector: 'app-json-outline',
  templateUrl: './json-outline.component.html',
  styleUrls: ['./json-outline.component.scss']
})
export class JsonOutlineComponent implements OnInit, OnChanges {
  @Input() jsonData: any;
  @Input() isValidJson: boolean = false;
  @Input() isDarkTheme: boolean = false;
  @Input() showOutline: boolean = false;

  @Output() navigateToPosition = new EventEmitter<{ line: number, column: number }>();
  
  outlineData: OutlineNode[] = [];
  
  constructor() { }

  ngOnInit(): void {
    this.generateOutline();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jsonData'] || changes['isValidJson']) {
      this.generateOutline();
    }
  }
  
  /**
   * Generates the outline data from the JSON data
   */
  generateOutline(): void {
    if (!this.isValidJson || !this.jsonData) {
      this.outlineData = [];
      return;
    }
    
    try {
      // If jsonData is a string, parse it
      const data = typeof this.jsonData === 'string' ? JSON.parse(this.jsonData) : this.jsonData;
      this.outlineData = this.buildOutlineTree(data, '$', 0, 0);
    } catch (error) {
      console.error('Error generating outline:', error);
      this.outlineData = [];
    }
  }
  
  /**
   * Builds the outline tree recursively
   * @param data The JSON data to build the outline from
   * @param path The current path in the JSON structure
   * @param line The line number in the editor
   * @param column The column number in the editor
   * @returns An array of outline nodes
   */
  private buildOutlineTree(data: any, path: string, line: number, column: number): OutlineNode[] {
    const result: OutlineNode[] = [];
    
    if (data === null) {
      return [{ key: path === '$' ? 'Root' : path.split('.').pop() || '', path, type: 'null', line, column }];
    }
    
    if (Array.isArray(data)) {
      const arrayNode: OutlineNode = {
        key: path === '$' ? 'Root Array' : path.split('.').pop() || '',
        path,
        type: 'array',
        children: [],
        expanded: false,
        line,
        column
      };
      
      // Add children for array items
      data.forEach((item, index) => {
        const itemPath = `${path}[${index}]`;
        const childNodes = this.buildOutlineTree(item, itemPath, line, column);
        if (arrayNode.children) {
          arrayNode.children.push(...childNodes);
        }
      });
      
      result.push(arrayNode);
    } else if (typeof data === 'object') {
      const objectNode: OutlineNode = {
        key: path === '$' ? 'Root Object' : path.split('.').pop() || '',
        path,
        type: 'object',
        children: [],
        expanded: false,
        line,
        column
      };
      
      // Add children for object properties
      Object.keys(data).forEach(key => {
        const propPath = path === '$' ? key : `${path}.${key}`;
        const childNodes = this.buildOutlineTree(data[key], propPath, line, column);
        if (objectNode.children) {
          objectNode.children.push(...childNodes);
        }
      });
      
      result.push(objectNode);
    } else {
      // Handle primitive values
      const type = typeof data as 'string' | 'number' | 'boolean';
      result.push({
        key: path === '$' ? 'Value' : path.split('.').pop() || '',
        path,
        type,
        line,
        column
      });
    }
    
    return result;
  }
  
  /**
   * Toggles the expanded state of a node
   * @param node The node to toggle
   */
  toggleNode(node: OutlineNode): void {
    if (node.children && node.children.length > 0) {
      node.expanded = !node.expanded;
    }
  }
  
  /**
   * Navigates to the position of a node in the editor
   * @param node The node to navigate to
   */
  navigateToNode(node: OutlineNode): void {
    if (node.line !== undefined && node.column !== undefined) {
      this.navigateToPosition.emit({ line: node.line, column: node.column });
    }
  }
  
  /**
   * Gets the icon for a node based on its type
   * @param node The node to get the icon for
   * @returns The icon name
   */
  getNodeIcon(node: OutlineNode): string {
    switch (node.type) {
      case 'object':
        return 'code';
      case 'array':
        return 'format_list_bulleted';
      case 'string':
        return 'text_fields';
      case 'number':
        return 'filter_9_plus';
      case 'boolean':
        return 'toggle_on';
      case 'null':
        return 'block';
      default:
        return 'help';
    }
  }
}