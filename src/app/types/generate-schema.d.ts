declare module 'generate-schema' {
  /**
   * Generates a JSON schema from a JSON object
   * @param title Optional title for the schema
   * @param object The JSON object to generate a schema for
   * @returns The generated JSON schema
   */
  export function json(title: string | object, object?: object): any;

  /**
   * Generates a Mongoose schema from a JSON object
   */
  export function mongoose(title: string | object, object?: object): any;

  /**
   * Generates a BigQuery schema from a JSON object
   */
  export function bigquery(title: string | object, object?: object): any;

  /**
   * Generates a MySQL schema from a JSON object
   */
  export function mysql(title: string | object, object?: object): any;

  /**
   * Generates a generic schema from a JSON object
   */
  export function generic(title: string | object, object?: object): any;

  /**
   * Generates a ClickHouse schema from a JSON object
   */
  export function clickhouse(title: string | object, object?: object): any;
}