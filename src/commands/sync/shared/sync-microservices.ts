import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getEnvDirectory, logger } from "../../../util/utils";

import { red } from "colors/safe";
import { SharedSyncData } from "../sync-command";
import { ValuesSpecification } from "../types";

export interface SyncMicroservicesparams extends SharedSyncData {
  customName: string;
  type: "ui" | "bff" | "svc";
}

export class SyncMicroservices
  implements SynchronizationStep<SyncMicroservicesparams>
{
  synchronize(
    _: ValuesSpecification,
    { env, dry, ...params }: SyncMicroservicesparams
  ): void {
    const importsDir = getEnvDirectory(
      "./imports/product-store/microservices/",
      env
    );

    const fileName = `${params.productName}_${params.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    const jsonContent = {
      version: "xxx",
      description: params.customName,
      name: params.customName,
      type: params.type,
    };

    if (dry) {
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
    _: ValuesSpecification,
    { env, dry, ...params }: SyncMicroservicesparams
  ): void {
    const importsDir = getEnvDirectory(
      "./imports/product-store/microservices/",
      env
    );

    const fileName = `${params.productName}_${params.customName}.json`;
    const filePath = path.join(importsDir, fileName);

    if (dry) {
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
