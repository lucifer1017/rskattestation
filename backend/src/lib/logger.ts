const isProd = process.env.NODE_ENV === "production";

export const logger = {
  info: (msg: string, ...args: unknown[]) => {
    console.log(msg, ...args);
  },
  error: (msg: string, ...args: unknown[]) => {
    console.error(msg, ...args);
  },
  debug: (msg: string, ...args: unknown[]) => {
    if (!isProd) {
      console.log(msg, ...args);
    }
  },
};
