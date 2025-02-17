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
