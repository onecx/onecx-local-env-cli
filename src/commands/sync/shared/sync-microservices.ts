import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SharedData } from "./shared-data";
import { red } from "colors/safe";

export interface SyncMicroservicesParameters extends SharedData {
  customName: string;
}

export class SyncMicroservices
  implements SynchronizationStep<SyncMicroservicesParameters>
{
  synchronize(
    _: any,
    parameters: SyncMicroservicesParameters,
    { dry: dryRun, env }: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/microservices/",
      env
    );

    const fileName = `${parameters.productName}_${parameters.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    const jsonContent = {
      version: "xxx",
      description: parameters.customName,
      name: parameters.customName,
      type: "ui",
    };

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        JSON.stringify(jsonContent, null, 2)
      );
    } else {
      fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
    }

    logger.info("Microservices synchronized successfully.");
  }

  removeSynchronization(
    _: any,
    input: SyncMicroservicesParameters,
    options: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/microservices/",
      options.env
    );

    const fileName = `${input.productName}_${input.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    if (options.dry) {
      logger.info(`Dry Run: Would remove file at ${filePath}`);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(red(`- ${filePath}`));
      }
    }

    logger.info("Microservices removed successfully.");
  }
}
