import { NgModule } from '@angular/core';
import { JsonToYamlConverter, YamlToJsonConverter } from './yaml-converter';
import { JsonToCsvConverter } from './csv-converter';
import { JsonToXmlConverter, XmlToJsonConverter } from './xml-converter';
import { Json5ToJsonConverter } from './json5-converter';

/**
 * Module that provides all converter implementations
 * This ensures that all converters are registered with Angular's dependency injection system
 */
@NgModule({
  providers: [
    JsonToYamlConverter,
    YamlToJsonConverter,
    JsonToCsvConverter,
    JsonToXmlConverter,
    XmlToJsonConverter,
    Json5ToJsonConverter
  ]
})
export class ConvertersModule {}