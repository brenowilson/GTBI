/**
 * Structured logger for Edge Functions.
 * All log entries include function name and timestamp for easy filtering.
 */

interface LogContext {
  functionName: string;
  userId?: string;
  [key: string]: unknown;
}

function formatEntry(level: string, message: string, context: LogContext): string {
  const ts = new Date().toISOString();
  const base = { ts, level, fn: context.functionName, msg: message };
  const { functionName: _fn, ...rest } = context;
  return JSON.stringify({ ...base, ...rest });
}

export function createLogger(functionName: string) {
  return {
    info(message: string, data?: Record<string, unknown>) {
      console.log(formatEntry("INFO", message, { functionName, ...data }));
    },
    warn(message: string, data?: Record<string, unknown>) {
      console.warn(formatEntry("WARN", message, { functionName, ...data }));
    },
    error(message: string, data?: Record<string, unknown>) {
      console.error(formatEntry("ERROR", message, { functionName, ...data }));
    },
    request(method: string, userId?: string) {
      console.log(formatEntry("INFO", `${method} request received`, { functionName, userId }));
    },
    response(status: number, userId?: string) {
      console.log(formatEntry("INFO", `Response ${status}`, { functionName, userId, status }));
    },
  };
}
