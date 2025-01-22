import fs from "fs";
import path from "path";
import {
  SynchronizationStep,
  SynchronizationStepOptions,
} from "../../../util/synchronization-step";

import { getImportsDirectory, logger } from "../../../util/utils";
import { SyncUIData } from "./sync-ui";

export interface SyncSlotsParameters extends SyncUIData {
  uiName: string;
}

export class SyncSlots implements SynchronizationStep<SyncSlotsParameters> {
  synchronize(
    values: any,
    parameters: SyncSlotsParameters,
    { env, dry: dryRun }: SynchronizationStepOptions
  ): void {
    let importsDirectory = getImportsDirectory(
      "./imports/product-store/slots",
      env
    );

    if (!values.app || !values.app.operator || !values.app.operator.slot) {
      logger.info("No slots found in values file. Skipping synchronization.");
      return;
    }

    const slots = values.app.operator.slot.specs;

    for (const [key, spec] of Object.entries(slots) as [string, any][]) {
      const fileName = `${parameters.productName}_${parameters.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      const jsonContent = {
        description: spec.description,
        name: spec.name,
        deprecated: false,
        undeployed: false,
      };

      if (dryRun) {
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
    values: any,
    input: SyncSlotsParameters,
    options: SynchronizationStepOptions
  ): void {
    let importsDirectory = getImportsDirectory(
      "./imports/product-store/slots",
      options.env
    );

    if (!values.app || !values.app.operator || !values.app.operator.slot) {
      logger.info("No slots found in values file. Skipping removal.");
      return;
    }

    const slots = values.app.operator.slot.specs;

    for (const key of Object.keys(slots)) {
      const fileName = `${input.productName}_${input.uiName}_${key}.json`;
      const filePath = path.join(importsDirectory, fileName);

      if (options.dry) {
        logger.info(`Dry Run: Would remove file at ${filePath}`);
      } else {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Removed file at ${filePath}`);
        } else {
          logger.info(`File not found at ${filePath}, skipping removal.`);
        }
      }
    }

    logger.info("Slots removal completed successfully.");
  }
}
