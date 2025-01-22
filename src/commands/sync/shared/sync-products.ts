import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";
import { getImportsDirectory, logger } from "../../../util/utils";
import { SharedSyncData } from "../sync-command";

export interface SyncProductsParams extends SharedSyncData {
  icon: string;
  basePath: string;
}

export class SyncProducts implements SynchronizationStep<SyncProductsParams> {
  synchronize(_: any, { env, dry, ...params }: SyncProductsParams): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/products/",
      env
    );

    // Target file
    const filePath = path.resolve(importsDir, `${params.productName}.json`);

    // Product JSON
    const product = {
      version: "xxx",
      description: params.productName.replace(/-/g, " "),
      basePath: params.basePath,
      displayName: params.productName.replace(/-/g, " "),
      iconName: params.icon,
    };

    if (dry) {
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
    { env, dry, ...params }: SyncProductsParams
  ): void {
    let importsDir = getImportsDirectory(
      "./imports/product-store/products/",
      env
    );

    const filePath = path.resolve(importsDir, `${params.productName}.json`);

    if (dry) {
      logger.info(`Dry Run: Would remove file at ${filePath}`);
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info("Product removed successfully.");
      }
    }
  }
}
