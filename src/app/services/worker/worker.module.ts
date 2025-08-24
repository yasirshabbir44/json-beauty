import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseWorkerService } from './base-worker.service';
import { JsonParsingService } from './json-parsing.service';
import { JsonConversionService } from './json-conversion.service';
import { JsonAnalysisService } from './json-analysis.service';

/**
 * Module for worker-related services
 * Follows Dependency Inversion Principle by providing interfaces and implementations
 */
@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    BaseWorkerService,
    JsonParsingService,
    JsonConversionService,
    JsonAnalysisService
  ]
})
export class WorkerModule { }