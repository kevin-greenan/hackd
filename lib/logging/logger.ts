type LogLevel = "error" | "info" | "warn";

type LogContext = Record<string, boolean | number | string | null | undefined>;

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  error: (event: string, context?: LogContext) => writeLog("error", event, context),
  info: (event: string, context?: LogContext) => writeLog("info", event, context),
  warn: (event: string, context?: LogContext) => writeLog("warn", event, context)
};
