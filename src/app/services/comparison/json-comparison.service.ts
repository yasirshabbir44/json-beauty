import {Injectable} from '@angular/core';
import {IJsonComparisonService} from '../../interfaces';
import {loadJsondiffpatch} from '../../utils/lazy-import.util';

/**
 * Service for JSON comparison operations
 * Follows the Single Responsibility Principle by focusing only on comparison concerns
 */
@Injectable()
export class JsonComparisonService implements IJsonComparisonService {
    private diffPatcher?: ReturnType<typeof import('jsondiffpatch').create>;

    private async getDiffPatcher(): Promise<ReturnType<typeof import('jsondiffpatch').create>> {
        if (!this.diffPatcher) {
            const jsondiffpatch = await loadJsondiffpatch();
            this.diffPatcher = jsondiffpatch.create();
        }
        return this.diffPatcher;
    }

    /**
     * Compares two JSON strings and returns the differences
     */
    async compareJson(leftJsonString: string, rightJsonString: string): Promise<{
        hasDifferences: boolean;
        differences: any;
        formattedDiff?: string;
    }> {
        try {
            const jsondiffpatch = await loadJsondiffpatch();
            const diffPatcher = await this.getDiffPatcher();
            const leftJson = JSON.parse(leftJsonString);
            const rightJson = JSON.parse(rightJsonString);
            const delta = diffPatcher.diff(leftJson, rightJson);
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
