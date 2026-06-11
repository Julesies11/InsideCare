/**
 * Simple logger utility for the application.
 */

export interface LogErrorParams {
  message: string;
  stack?: string;
  componentName?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs an error to the console and potentially to an external monitoring service in the future.
 */
export async function logError(params: LogErrorParams): Promise<void> {
  console.error(
    `[${params.componentName || 'General'}] Error: ${params.message}`,
    {
      stack: params.stack,
      metadata: params.metadata,
    },
  );

  // Future: Add integration with Sentry or similar service here
}
