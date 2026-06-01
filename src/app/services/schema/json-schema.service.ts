import {Injectable} from '@angular/core';
import {IJsonSchemaService} from '../../interfaces';
import {createAjv, loadGenerateSchema} from '../../utils/lazy-import.util';

/**
 * Service for JSON schema operations
 */
@Injectable()
export class JsonSchemaService implements IJsonSchemaService {
    private ajvPromise?: Promise<import('ajv').default>;
    private indentSize = 2;
    private indentChar = ' ';

    private getAjv(): Promise<import('ajv').default> {
        if (!this.ajvPromise) {
            this.ajvPromise = createAjv({allErrors: true});
        }
        return this.ajvPromise;
    }

    async generateJsonSchema(jsonString: string): Promise<string> {
        try {
            const generateSchema = await loadGenerateSchema();
            const jsonObj = JSON.parse(jsonString || '{}');
            const schema = generateSchema(jsonObj);
            return JSON.stringify(schema, null, this.indentChar.repeat(this.indentSize));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Error generating JSON schema: ${errorMessage}`);
        }
    }

    async validateJsonSchema(jsonString: string, schemaString: string): Promise<{
        isValid: boolean;
        errors?: any[];
    }> {
        try {
            const ajv = await this.getAjv();
            const json = JSON.parse(jsonString);
            const schema = JSON.parse(schemaString);
            const validate = ajv.compile(schema);
            const isValid = validate(json);

            return {
                isValid: !!isValid,
                errors: validate.errors || []
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                isValid: false,
                errors: [{message: errorMessage}]
            };
        }
    }
}
