declare module 'jsonpath' {
  /**
   * Applies the JSONPath expression to the given object and returns the matching elements
   */
  export function query(obj: any, path: string): any[];

  /**
   * Applies the JSONPath expression to the given object and returns the first matching element
   */
  export function value(obj: any, path: string): any;

  /**
   * Returns a path expression for the given path array
   */
  export function stringify(path: any[]): string;

  /**
   * Parses the given path expression into a path array
   */
  export function parse(path: string): any[];

  /**
   * Returns a list of all possible paths in the given object
   */
  export function paths(obj: any): string[];

  /**
   * Returns a list of all possible paths and their values in the given object
   */
  export function nodes(obj: any): { path: string, value: any }[];
}