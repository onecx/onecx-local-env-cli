import fs from "fs";
import path from "path";
import { SynchronizationStep } from "../../../util/synchronization-step";

import { red } from "colors/safe";
import { getEnvDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";
import { ValuesSpecification } from "../types";

export interface SyncSlotsparams extends SyncUIData {
  uiName: string;
}

export class SyncSlots implements SynchronizationStep<SyncSlotsparams> {
  synchronize(
    values: ValuesSpecification,
    { env, dry, ...params }: SyncSlotsparams
  ): void {
    const importsDirectory = getEnvDirectory(
      "./imports/product-store/slots",
      env
    );

    if (!values.app || !values.app.operator || !values.app.operator.slot) {
      logger.info("No slots found in values file. Skipping synchronization.");
      return;
    }

    const slots = values.app.operator.slot.specs;

    for (const [key, spec] of Object.entries(slots) as [
      string,
      {
        name: string;
        description: string;
      }
    ][]) {
      const fileName = `${params.productName}_${params.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      const jsonContent = {
        description: spec.description,
        name: spec.name,
        deprecated: false,
        undeployed: false,
      };

      if (dry) {
        logger.info(
          `Dry Run: Would write to ${filePath} with content:`,
          JSON.stringify(jsonContent, null, 2)
        );
      } else {
        fs.writeFileSync(filePath, JSON.stringify(jsonContent, null, 2));
      }
    }

    logger.info("Slots synchronized successfully.");
  }

  removeSynchronization(
    values: ValuesSpecification,
    { env, dry, ...params }: SyncSlotsparams
  ): void {
    const importsDirectory = getEnvDirectory(
      "./imports/product-store/slots",
      env
    );

    if (!values.app || !values.app.operator || !values.app.operator.slot) {
      logger.info("Slots removed successfully.");
      return;
    }

    const slots = values.app.operator.slot.specs;

    for (const key of Object.keys(slots)) {
      const fileName = `${params.productName}_${params.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      if (dry) {
        logger.info(`Dry Run: Would remove file at ${filePath}`);
      } else {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(red(`- ${filePath}`));
        }
      }
    }

    logger.info("Slots removed successfully.");
  }
}
