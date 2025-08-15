/**
 * Interface for JSON comparison services
 * Follows the Interface Segregation Principle by defining a focused set of methods
 * related to comparing JSON data
 */
export interface IJsonComparisonService {
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
    };
}