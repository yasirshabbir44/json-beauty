import {MockDataSimulatorOptions, StructureBlueprint} from '../types/mock-data.types';

/**
 * Interface for deterministic mock data generation from structural blueprints.
 */
export interface IMockDataSimulatorService {
    buildBlueprintFromJson(jsonString: string): StructureBlueprint;

    buildBlueprintFromSchema(schemaString: string): StructureBlueprint;

    generateMockDataset(blueprint: StructureBlueprint, options?: MockDataSimulatorOptions): string;

    generateFromJsonSample(jsonString: string, options?: MockDataSimulatorOptions): string;

    generateFromSchema(schemaString: string, options?: MockDataSimulatorOptions): string;
}
