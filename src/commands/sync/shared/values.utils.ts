import fs from "fs";
import yaml from "js-yaml";

export async function retrieveValuesYAML(pathOrUrl: string): Promise<any> {
  // Check if is URL
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    const response = await fetch(pathOrUrl);
      if (!response.ok) {
          throw new Error(`Failed to fetch ${pathOrUrl}: ${response.statusText}`);
      }
      return await yaml.load(await response.text());
  } else {
    if (!fs.existsSync(pathOrUrl)) {
      throw new Error(`Values file not found at path: ${pathOrUrl}`);
    }
    return new Promise((resolve, reject) => {
      fs.readFile(pathOrUrl, "utf8", (err, data) => {
        if (err) {
          reject(err);
        } else {
          try {
            resolve(yaml.load(data));
          } catch (parseErr) {
            reject(parseErr);
          }
        }
      });
    });
  }
}
