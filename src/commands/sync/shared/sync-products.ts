import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SharedData } from "./shared-data";

export interface SyncProductsParameters extends SharedData {
  icon: string;
  basePath: string;
}

export class SyncProducts
  implements SynchronizationStep<SyncProductsParameters>
{
  synchronize(
    _: any,
    parameters: SyncProductsParameters,
    { dry: dryRun, env }: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/products/",
      env
    );

    // Target file
    const filePath = path.resolve(importsDir, `${parameters.productName}.json`);

    // Product JSON
    const product = {
      version: "xxx",
      description: parameters.productName.replace(/-/g, " "),
      basePath: parameters.basePath,
      displayName: parameters.productName.replace(/-/g, " "),
      iconName: parameters.icon,
    };

    if (dryRun) {
      logger.info(
        `Dry Run: Would write to ${filePath} with content:`,
        JSON.stringify(product, null, 2)
      );
    } else {
      fs.writeFileSync(filePath, JSON.stringify(product, null, 2));
    }

    logger.info("Product synchronized successfully.");
  }

  removeSynchronization(
    _: any,
    input: SyncProductsParameters,
    options: SynchronizationStepOptions
  ): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/products/",
      options.env
    );

    const filePath = path.resolve(importsDir, `${input.productName}.json`);

    if (options.dry) {
      logger.info(`Dry Run: Would remove file at ${filePath}`);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info("Product removed successfully.");
      }
    }
  }
}
