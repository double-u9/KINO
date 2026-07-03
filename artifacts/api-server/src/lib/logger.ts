type LogMethod = (...args: unknown[]) => void;

export const logger: {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  debug: LogMethod;
} = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args);
    }
  },
};
