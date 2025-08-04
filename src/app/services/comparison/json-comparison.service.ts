import { Injectable } from '@angular/core';
import { IJsonComparisonService } from '../../interfaces';
import * as jsondiffpatch from 'jsondiffpatch';

/**
 * Service for JSON comparison operations
 * Follows the Single Responsibility Principle by focusing only on comparison concerns
 */
@Injectable({
  providedIn: 'root'
})
export class JsonComparisonService implements IJsonComparisonService {
  private diffPatcher = jsondiffpatch.create();

  constructor() {}

  /**
   * Compares two JSON strings and returns the differences
   * @param leftJsonString The first JSON string
   * @param rightJsonString The second JSON string
   * @returns Object containing comparison results
   */
  compareJson(leftJsonString: string, rightJsonString: string): { 
    hasDifferences: boolean; 
    differences: any; 
    formattedDiff?: string;
  } {
    try {
      // Parse the JSON strings
      const leftJson = JSON.parse(leftJsonString);
      const rightJson = JSON.parse(rightJsonString);

      // Calculate the delta between the two objects
      const delta = this.diffPatcher.diff(leftJson, rightJson);

      // Generate HTML visualization of the differences
      // Handle the case where delta might be undefined
      const formattedDiff = delta ? jsondiffpatch.formatters.html.format(delta, leftJson) : '';

      return {
        hasDifferences: !!delta,
        differences: delta,
        formattedDiff
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Error comparing JSON: ${errorMessage}`);
    }
  }
}