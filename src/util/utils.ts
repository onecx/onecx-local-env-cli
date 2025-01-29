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
  info: (...msg: any[]) => console.log(colors.green("INFO:"), ...msg),
  warning: (...msg: any[]) => console.warn(colors.yellow("WARNING:"), ...msg),
  error: (...msg: any[]) => console.error(colors.red("ERROR:"), ...msg),
  verbose: (...msg: any[]) => {
    if (process.env.VERBOSE) {
      console.log(colors.blue("VERBOSE:"), ...msg);
    }
  },
};
