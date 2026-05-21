/** Categories of deterministic syntax repairs applied to invalid JSON. */
export type JsonRepairFixKind =
    | 'missing-quotes'
    | 'single-quotes'
    | 'trailing-commas'
    | 'unclosed-brackets'
    | 'json5-syntax'
    | 'formatting';

export interface JsonRepairResult {
    success: boolean;
    repairedJson: string;
    fixesApplied: JsonRepairFixKind[];
    error?: string;
}
