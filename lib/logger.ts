type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = process.env.NODE_ENV !== 'production';

class Logger {
    private format(level: LogLevel, message: string, meta?: unknown) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            meta,
        };
    }

    debug(message: string, meta?: unknown) {
        if (isDev) {
            console.debug(this.format('debug', message, meta));
        }
    }

    info(message: string, meta?: unknown) {
        if (isDev) {
            console.info(this.format('info', message, meta));
        }
    }

    warn(message: string, meta?: unknown) {
        console.warn(this.format('warn', message, meta));
    }

    error(message: string, meta?: unknown) {
        console.error(this.format('error', message, meta));
    }
}

export const logger = new Logger();