import { createHash } from 'node:crypto';

export type LogFields = Record<string, unknown>;
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PRIVATE_FIELD =
  /authorization|cookie|password|secret|token|credential|api.?key|code/i;
const IDENTIFIER_FIELD =
  /(?:^|_)(?:email|ip|user.?id|project.?id|submission.?id|client.?id)$/i;

export function hashForLogging(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function sanitizeValue(
  value: unknown,
  key: string,
  ancestors: WeakSet<object> = new WeakSet(),
): unknown {
  if (PRIVATE_FIELD.test(key)) return '[REDACTED]';
  if (IDENTIFIER_FIELD.test(key) && typeof value === 'string') {
    return hashForLogging(value);
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message };
  }
  if (value && typeof value === 'object') {
    if (ancestors.has(value)) return '[CIRCULAR]';
    ancestors.add(value);
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, key, ancestors));
    }
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeValue(childValue, childKey, ancestors),
      ]),
    );
  }
  return value;
}

export function sanitizeLogFields(fields: LogFields): LogFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      sanitizeValue(value, key),
    ]),
  );
}

export function createLogger(write: (line: string) => void = console.log) {
  const log = (level: LogLevel, event: string, fields: LogFields = {}) => {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...sanitizeLogFields(fields),
    };

    try {
      write(JSON.stringify(record));
    } catch {
      // Observability must never change application behavior.
      try {
        write(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            event: 'logger.write_failed',
          }),
        );
      } catch {
        // There is no safe output channel left.
      }
    }
  };

  return {
    debug: (event: string, fields?: LogFields) => {
      log('debug', event, fields);
    },
    info: (event: string, fields?: LogFields) => {
      log('info', event, fields);
    },
    warn: (event: string, fields?: LogFields) => {
      log('warn', event, fields);
    },
    error: (event: string, fields?: LogFields) => {
      log('error', event, fields);
    },
  };
}

export const logger = createLogger();
