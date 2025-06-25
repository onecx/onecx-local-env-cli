import fs from "fs";
import yaml from "js-yaml";
import { OneCXValuesSpecification } from "../types";
import { defaultValuesMapper, safeAccessViaPath, ValuesMapper } from "../../../util/utils";

export async function retrieveValuesYAML(
  pathOrUrl: string,
  onecxSectionPath: string,
  valuesMapper: ValuesMapper = defaultValuesMapper
): Promise<OneCXValuesSpecification> {
  const valuesContent = await _loadValuesYAMLContent(pathOrUrl);
  if (onecxSectionPath && !valuesMapper) {
    const section = safeAccessViaPath(valuesContent, onecxSectionPath);
    if (!section) {
      throw new Error(`Section not found in values file at path: ${onecxSectionPath}`);
    }
    return section as OneCXValuesSpecification;
  }
  return valuesMapper(valuesContent) as OneCXValuesSpecification;
}

async function _loadValuesYAMLContent(
  pathOrUrl: string,
): Promise<object> {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    const response = await fetch(pathOrUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${pathOrUrl}: ${response.statusText}`);
    }
    return (await yaml.load(await response.text()) as object);
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
            resolve(yaml.load(data) as object);
          } catch (parseErr) {
            reject(parseErr);
          }
        }
      });
    });
  }
}
