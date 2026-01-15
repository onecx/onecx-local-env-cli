import { getEnvDirectory, logger } from "../../util/utils";
import { OnecxCommand } from "../onecx-command";
import fs from "fs";
import yaml from "js-yaml";
import { DockerFileContent } from "../sync/types";

export interface RemoveDockerCommandParameters {
  name: string;
  productName: string;
  sections: string[];
  env: string;
  dry: boolean;
  adaptDotEnv: boolean;
}

export class RemoveDockerCommand
  implements OnecxCommand<RemoveDockerCommandParameters>
{
  run(data: RemoveDockerCommandParameters): void {
    logger.info("Removing services...");

    this.removeFromDockerCompose(data);
    logger.info(`Removed services from ${data.name}.compose.yaml`);
  }

  removeFromDockerCompose(data: RemoveDockerCommandParameters) {
    const envDirectory = getEnvDirectory("", data.env);
    const fileName = `${data.name}.compose.yaml`;
    const filePath = `${envDirectory}/${fileName}`;

    let fileContent: DockerFileContent = {};
    if (fs.existsSync(filePath)) {
      const composeFile = fs.readFileSync(filePath, "utf8");
      fileContent = yaml.load(composeFile) as DockerFileContent;
    }

    if (!fileContent.services) {
      return logger.error(
        `File ${fileName} does not contain any services, aborting...`
      );
    }

    for (const section of data.sections) {
      if (fileContent.services[`${data.productName}-${section}`]) {
        delete fileContent.services[`${data.productName}-${section}`];
        logger.info(`Service ${data.productName}-${section} removed`);
      } else {
        logger.warning(
          `Service ${data.productName}-${section} not found, skipping...`
        );
      }
    }

    const yamlContent = yaml.dump(fileContent, {
      lineWidth: -1,
    });
    if (data.dry) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:\n${yamlContent}`
      );
    } else {
      fs.writeFileSync(filePath, yamlContent);
    }

    if (data.adaptDotEnv) {
      const envPath = `${envDirectory}/.env`;
      let envFile = fs.readFileSync(envPath, "utf8");
      const underscoreName = data.productName.replace(/-/g, "_").toUpperCase();

      for (const section of data.sections) {
        const key = `${underscoreName}_${section.toUpperCase()}`;
        if (envFile.includes(key)) {
          const regex = new RegExp(`^${key}=.*$`, "gm");
          envFile = envFile.replace(regex, "");
          logger.info(`[.env] Removed entry for ${key}`);
        } else {
          logger.warning(`[.env] Entry ${key} not found, skipping...`);
        }
      }

      if (data.dry) {
        logger.info(
          `Dry Run: Would write to ${envPath} with content:`,
          envFile
        );
      } else {
        logger.info("[.env] Updated .env");
        fs.writeFileSync(envPath, envFile);
      }
    }
  }
}
