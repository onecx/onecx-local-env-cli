import path from "path";
import * as colors from "colors/safe";

export function getEnvDirectory(subpath: string, env?: string): string {
  let envDir = path.resolve(subpath);
  if (env) {
    const localEnvPath = path.resolve(env);
    envDir = path.resolve(localEnvPath, subpath);
  }
  return envDir;
}

export function safeAccessViaPath(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined; // Return undefined if the path does not exist
    }
  }
  return current;
}

export const logger = {
  info: (...msg: unknown[]) => console.log(colors.green("INFO:"), ...msg),
  warning: (...msg: unknown[]) => console.warn(colors.yellow("WARNING:"), ...msg),
  error: (...msg: unknown[]) => console.error(colors.red("ERROR:"), ...msg),
  verbose: (...msg: unknown[]) => {
    if (process.env.VERBOSE) {
      console.log(colors.blue("VERBOSE:"), ...msg);
    }
  },
};
