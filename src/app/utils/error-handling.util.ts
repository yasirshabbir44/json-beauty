/**
 * Utility functions for standardized error handling across the application
 */

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  message: string;
  details?: string;
  code?: string;
  originalError?: unknown;
}

/**
 * Creates a standardized error response object
 * @param error The original error
 * @param operation The operation that failed
 * @returns A standardized error response
 */
export function createErrorResponse(error: unknown, operation: string): ErrorResponse {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return {
    message: `Error during ${operation}: ${errorMessage}`,
    details: error instanceof Error ? error.stack : undefined,
    originalError: error
  };
}

/**
 * Wraps a function with standardized error handling
 * @param fn The function to wrap
 * @param operation Description of the operation for error messages
 * @returns The wrapped function with error handling
 */
export function withErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => T,
  operation: string
): (...args: Args) => T | ErrorResponse {
  return (...args: Args) => {
    try {
      return fn(...args);
    } catch (error) {
      return createErrorResponse(error, operation);
    }
  };
}

/**
 * Wraps an async function with standardized error handling
 * @param fn The async function to wrap
 * @param operation Description of the operation for error messages
 * @returns The wrapped async function with error handling
 */
export function withAsyncErrorHandling<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  operation: string
): (...args: Args) => Promise<T | ErrorResponse> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return createErrorResponse(error, operation);
    }
  };
}

/**
 * Checks if a result is an error response
 * @param result The result to check
 * @returns True if the result is an error response
 */
export function isErrorResponse(result: unknown): result is ErrorResponse {
  return result !== null && 
         typeof result === 'object' && 
         'message' in (result as object);
}