import { Injectable } from '@angular/core';
import { BaseConverter } from '../base/base-converter';
import * as yaml from 'js-yaml';

/**
 * Converter for YAML to JSON conversion
 * Implements the Strategy pattern as a concrete strategy
 */
@Injectable({
  providedIn: 'root'
})
export class YamlToJsonConverter extends BaseConverter {
  /**
   * Converts YAML string to JSON string
   * @param yamlString The YAML string to convert
   * @returns The JSON string
   */
  convert(yamlString: string): string {
    return this.handleConversionError(() => {
      // Parse YAML string to JavaScript object
      const obj = yaml.load(yamlString || this.DEFAULT_EMPTY_STRING);
      
      // Convert the object to a JSON string with proper indentation
      return JSON.stringify(obj, null, this.getIndentation());
    }, 'YAML to JSON');
  }
}