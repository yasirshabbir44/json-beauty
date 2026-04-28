import {JsonService} from '../../services/json.service';

export type OutputConversionType = 'csv' | 'xml';

export interface OutputConversionExecution {
    convert: () => string | Promise<string>;
    emptyResultMessage: string;
    successMessage: string;
    errorLabel: string;
    mimeType: string;
    filename: string;
    invalidInputMessage: string;
}

export interface OutputConversionStrategy {
    readonly type: OutputConversionType;
    createExecution(inputJson: string): OutputConversionExecution;
}

export class CsvOutputConversionStrategy implements OutputConversionStrategy {
    readonly type: OutputConversionType = 'csv';

    constructor(private readonly jsonService: JsonService) {}

    createExecution(inputJson: string): OutputConversionExecution {
        return {
            convert: () => this.jsonService.jsonToCsv(inputJson),
            emptyResultMessage:
                'Could not convert JSON to CSV. The JSON structure may not be suitable for CSV conversion.',
            successMessage: 'JSON converted to CSV and downloaded successfully',
            errorLabel: 'Error converting JSON to CSV',
            mimeType: 'text/csv',
            filename: 'json-data.csv',
            invalidInputMessage: 'Please enter valid JSON to convert to CSV'
        };
    }
}

export class XmlOutputConversionStrategy implements OutputConversionStrategy {
    readonly type: OutputConversionType = 'xml';

    constructor(private readonly jsonService: JsonService) {}

    createExecution(inputJson: string): OutputConversionExecution {
        return {
            convert: () => this.jsonService.jsonToXml(inputJson),
            emptyResultMessage:
                'Could not convert JSON to XML. The JSON structure may not be suitable for XML conversion.',
            successMessage: 'JSON converted to XML and downloaded successfully',
            errorLabel: 'Error converting JSON to XML',
            mimeType: 'application/xml',
            filename: 'json-data.xml',
            invalidInputMessage: 'Please enter valid JSON to convert to XML'
        };
    }
}
